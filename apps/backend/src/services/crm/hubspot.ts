import type { CRMConnector } from './index';

export const name = 'HubSpot';

export async function test(tokens: Record<string, string>): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('https://api.hubapi.com/integrations/v1/me', {
      headers: { Authorization: `Bearer ${tokens.accessToken}` },
    });
    if (res.ok) return { success: true };
    return { success: false, error: `HubSpot API error: ${res.status}` };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function syncContact(
  tokens: Record<string, string>,
  contact: Record<string, unknown>,
  mapping: Record<string, string>
): Promise<{ success: boolean; crmId?: string; error?: string }> {
  try {
    const properties: Record<string, string> = {};
    for (const [localKey, crmKey] of Object.entries(mapping)) {
      if (contact[localKey]) properties[crmKey] = String(contact[localKey]);
    }
    // Defaults
    if (!properties.email && contact.email) properties.email = String(contact.email);
    if (!properties.phone && contact.phone) properties.phone = String(contact.phone);
    if (!properties.firstname && contact.name) {
      const parts = String(contact.name).split(' ');
      properties.firstname = parts[0];
      if (parts[1]) properties.lastname = parts.slice(1).join(' ');
    }
    if (!properties.company && contact.company) properties.company = String(contact.company);

    const res = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ properties }),
    });

    const data = await res.json();
    if (res.ok) return { success: true, crmId: data.id };
    return { success: false, error: data.message || `HubSpot error ${res.status}` };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function syncDeal(
  tokens: Record<string, string>,
  deal: Record<string, unknown>,
  mapping: Record<string, string>
): Promise<{ success: boolean; crmId?: string; error?: string }> {
  try {
    const properties: Record<string, string> = {};
    for (const [localKey, crmKey] of Object.entries(mapping)) {
      if (deal[localKey]) properties[crmKey] = String(deal[localKey]);
    }
    if (!properties.dealname && deal.title) properties.dealname = String(deal.title);
    if (!properties.pipeline) properties.pipeline = 'default';
    if (!properties.dealstage) properties.dealstage = 'appointmentscheduled';

    const res = await fetch('https://api.hubapi.com/crm/v3/objects/deals', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ properties }),
    });

    const data = await res.json();
    if (res.ok) return { success: true, crmId: data.id };
    return { success: false, error: data.message || `HubSpot error ${res.status}` };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function syncNote(
  tokens: Record<string, string>,
  note: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('https://api.hubapi.com/crm/v3/objects/notes', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          hs_note_body: String(note.content),
          hs_timestamp: Date.now(),
        },
        associations: note.contactId
          ? [
              {
                to: { id: String(note.contactId) },
                types: [
                  {
                    associationCategory: 'HUBSPOT_DEFINED',
                    associationTypeId: 202,
                  },
                ],
              },
            ]
          : undefined,
      }),
    });

    if (res.ok) return { success: true };
    const data = await res.json();
    return { success: false, error: data.message };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
