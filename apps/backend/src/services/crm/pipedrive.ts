import type { CRMConnector } from './index';

export const name = 'Pipedrive';

export async function test(tokens: Record<string, string>): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`https://api.pipedrive.com/v1/users/me?api_token=${tokens.apiToken}`);
    if (res.ok) return { success: true };
    return { success: false, error: `Pipedrive API error: ${res.status}` };
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
    const person: Record<string, unknown> = {};
    for (const [localKey, crmKey] of Object.entries(mapping)) {
      if (contact[localKey]) person[crmKey] = contact[localKey];
    }
    if (!person.name && contact.name) person.name = contact.name;
    if (!person.email && contact.email) person.email = [{ value: contact.email, primary: true }];
    if (!person.phone && contact.phone) person.phone = [{ value: contact.phone, primary: true }];
    if (!person.org_id && contact.company) {
      // Try to find or create organization
      const orgRes = await fetch(
        `https://api.pipedrive.com/v1/organizations?api_token=${tokens.apiToken}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: contact.company }),
        }
      );
      const orgData = await orgRes.json();
      if (orgData.success) person.org_id = orgData.data.id;
    }

    const res = await fetch(
      `https://api.pipedrive.com/v1/persons?api_token=${tokens.apiToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(person),
      }
    );

    const data = await res.json();
    if (data.success) return { success: true, crmId: String(data.data.id) };
    return { success: false, error: data.error || `Pipedrive error` };
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
    const dealData: Record<string, unknown> = {};
    for (const [localKey, crmKey] of Object.entries(mapping)) {
      if (deal[localKey]) dealData[crmKey] = deal[localKey];
    }
    if (!dealData.title && deal.title) dealData.title = deal.title;
    if (deal.contactId) dealData.person_id = deal.contactId;

    const res = await fetch(
      `https://api.pipedrive.com/v1/deals?api_token=${tokens.apiToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dealData),
      }
    );

    const data = await res.json();
    if (data.success) return { success: true, crmId: String(data.data.id) };
    return { success: false, error: data.error };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
