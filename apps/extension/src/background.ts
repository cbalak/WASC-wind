const API_BASE = 'http://localhost:3001/api';

chrome.runtime.onInstalled.addListener(() => {
  console.log('WACC Extension installed');
});

// Handle messages from content script and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'CAPTURE_MESSAGE') {
    handleCapture(request.payload).then(sendResponse).catch((err) => sendResponse({ error: err.message }));
    return true; // async
  }

  if (request.type === 'HANDSHAKE') {
    performHandshake(request.apiKey).then(sendResponse).catch((err) => sendResponse({ error: err.message }));
    return true;
  }

  if (request.type === 'GET_TOKEN') {
    chrome.storage.local.get(['wacc_token', 'wacc_tenant'], (result) => {
      sendResponse({ token: result.wacc_token, tenant: result.wacc_tenant });
    });
    return true;
  }
});

async function handleCapture(payload: any) {
  const { wacc_token } = await chrome.storage.local.get(['wacc_token']);
  if (!wacc_token) return { error: 'Not authenticated. Please log in via the popup.' };

  const res = await fetch(`${API_BASE}/extension/capture`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${wacc_token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) return { error: data.error || `HTTP ${res.status}` };
  return data;
}

async function performHandshake(apiKey: string) {
  const res = await fetch(`${API_BASE}/extension/handshake`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey, deviceId: 'chrome-ext' }),
  });

  const data = await res.json();
  if (!res.ok) return { error: data.error };

  await chrome.storage.local.set({
    wacc_token: data.token,
    wacc_tenant: data.tenant,
    wacc_user: data.user,
  });

  return data;
}
