import type { CRMConnector } from './index';

export const name = 'Webhook';

export async function test(tokens: Record<string, string>): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(tokens.url as string, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(tokens.headers ? JSON.parse(tokens.headers) : {}) },
      body: JSON.stringify({ test: true }),
    });
    if (res.ok) return { success: true };
    return { success: false, error: `Webhook returned ${res.status}` };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function syncContact(
  tokens: Record<string, string>,
  contact: Record<string, unknown>,
  _mapping: Record<string, string>
): Promise<{ success: boolean; crmId?: string; error?: string }> {
  try {
    const res = await fetch(tokens.url as string, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(tokens.headers ? JSON.parse(tokens.headers) : {}),
      },
      body: JSON.stringify({
        event: 'contact_sync',
        contact,
        timestamp: new Date().toISOString(),
      }),
    });
    if (res.ok) return { success: true };
    return { success: false, error: `Webhook returned ${res.status}` };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
