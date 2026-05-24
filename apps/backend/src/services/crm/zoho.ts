import type { CRMConnector } from './index';

export const name = 'Zoho CRM';

export async function test(tokens: Record<string, string>): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${tokens.apiDomain}/crm/v2/users?type=CurrentUser`, {
      headers: { Authorization: `Zoho-oauthtoken ${tokens.accessToken}` },
    });
    if (res.ok) return { success: true };
    return { success: false, error: `Zoho API error: ${res.status}` };
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
    const record: Record<string, unknown> = {};
    for (const [localKey, crmKey] of Object.entries(mapping)) {
      if (contact[localKey]) record[crmKey] = contact[localKey];
    }
    if (!record.Last_Name && contact.name) {
      const parts = String(contact.name).split(' ');
      record.First_Name = parts[0];
      record.Last_Name = parts.slice(1).join(' ') || parts[0];
    }
    if (!record.Email && contact.email) record.Email = contact.email;
    if (!record.Phone && contact.phone) record.Phone = contact.phone;
    if (!record.Account_Name && contact.company) record.Account_Name = contact.company;

    const res = await fetch(`${tokens.apiDomain}/crm/v2/Leads`, {
      method: 'POST',
      headers: {
        Authorization: `Zoho-oauthtoken ${tokens.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data: [record] }),
    });

    const data = await res.json();
    if (data.data?.[0]?.code === 'SUCCESS') {
      return { success: true, crmId: data.data[0].details.id };
    }
    return { success: false, error: data.data?.[0]?.message || `Zoho error ${res.status}` };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
