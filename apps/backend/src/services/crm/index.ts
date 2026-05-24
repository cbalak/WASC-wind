import { encrypt, decrypt } from '../../lib/crypto';
import { prisma } from '../../lib/prisma';
import { logAudit } from '../../lib/audit';
import * as hubspot from './hubspot';
import * as zoho from './zoho';
import * as pipedrive from './pipedrive';
import * as webhook from './webhook';

export interface CRMConnector {
  name: string;
  test: (tokens: Record<string, string>) => Promise<{ success: boolean; error?: string }>;
  syncContact: (tokens: Record<string, string>, contact: Record<string, unknown>, mapping: Record<string, string>) => Promise<{ success: boolean; crmId?: string; error?: string }>;
  syncDeal?: (tokens: Record<string, string>, deal: Record<string, unknown>, mapping: Record<string, string>) => Promise<{ success: boolean; crmId?: string; error?: string }>;
  syncNote?: (tokens: Record<string, string>, note: Record<string, unknown>) => Promise<{ success: boolean; error?: string }>;
}

const connectors: Record<string, CRMConnector> = {
  hubspot,
  zoho,
  pipedrive,
  webhook,
};

export function getConnector(type: string): CRMConnector | undefined {
  return connectors[type];
}

export async function storeTokens(connectionId: string, tokens: Record<string, string>): Promise<void> {
  const encrypted = encrypt(JSON.stringify(tokens));
  await prisma.cRMConnection.update({
    where: { id: connectionId },
    data: { tokens: encrypted },
  });
}

export async function getTokens(connectionId: string): Promise<Record<string, string>> {
  const conn = await prisma.cRMConnection.findUnique({
    where: { id: connectionId },
    select: { tokens: true },
  });
  if (!conn || !conn.tokens) return {};
  try {
    return JSON.parse(decrypt(conn.tokens));
  } catch {
    return {};
  }
}

export async function testConnection(tenantId: string, type: string): Promise<{ success: boolean; error?: string }> {
  const conn = await prisma.cRMConnection.findUnique({
    where: { tenantId_type: { tenantId, type } },
  });
  if (!conn) return { success: false, error: 'Connection not configured' };

  const connector = getConnector(type);
  if (!connector) return { success: false, error: 'Connector not found' };

  const tokens = await getTokens(conn.id);
  return connector.test(tokens);
}

export async function syncContactToCRM(
  tenantId: string,
  contactId: string,
  options?: { createDeal?: boolean; note?: string }
): Promise<{ success: boolean; error?: string }> {
  const connections = await prisma.cRMConnection.findMany({
    where: { tenantId, status: 'connected' },
  });

  const contact = await prisma.contact.findUnique({
    where: { id: contactId },
    include: { conversations: { take: 1, orderBy: { createdAt: 'desc' } } },
  });

  if (!contact) return { success: false, error: 'Contact not found' };

  const results: { type: string; success: boolean; error?: string }[] = [];

  for (const conn of connections) {
    const connector = getConnector(conn.type);
    if (!connector) continue;

    const tokens = await getTokens(conn.id);

    // Sync contact
    const contactData: Record<string, unknown> = {
      name: contact.name || contact.phoneNumber,
      email: contact.email,
      phone: contact.phoneNumber,
      company: contact.company,
      tags: contact.tags,
    };

    const contactResult = await connector.syncContact(tokens, contactData, (conn.fieldMapping as Record<string, string>) || {});
    results.push({ type: conn.type, success: contactResult.success, error: contactResult.error });

    // Sync note if provided
    if (options?.note && connector.syncNote) {
      await connector.syncNote(tokens, { content: options.note, contactId: contactResult.crmId || contactId });
    }

    // Create deal if requested
    if (options?.createDeal && connector.syncDeal) {
      await connector.syncDeal(tokens, {
        title: `WhatsApp Lead - ${contact.name || contact.phoneNumber}`,
        contactId: contactResult.crmId,
        source: 'WhatsApp',
        status: 'open',
      }, (conn.fieldMapping as Record<string, string>) || {});
    }

    // Log sync
    await prisma.cRMSyncLog.create({
      data: {
        tenantId,
        connectionId: conn.id,
        operation: 'sync_contact',
        status: contactResult.success ? 'success' : 'error',
        error: contactResult.error,
      },
    });
  }

  const allSuccess = results.every((r) => r.success);
  await logAudit({
    tenantId,
    action: 'crm_sync_contact',
    resource: 'contact',
    resourceId: contactId,
    details: { results },
  });

  return { success: allSuccess, error: results.find((r) => !r.success)?.error };
}
