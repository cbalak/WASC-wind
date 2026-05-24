const API_BASE = 'http://localhost:3001/api';

let token: string | null = null;
let tenantId: string | null = null;

async function init() {
  const result = await chrome.storage.local.get(['wacc_token', 'wacc_tenant', 'wacc_user']);
  token = result.wacc_token || null;
  tenantId = result.wacc_tenant?.id || null;

  const authSection = document.getElementById('auth-section')!;
  const dashboardSection = document.getElementById('dashboard-section')!;

  if (!token) {
    authSection.style.display = 'block';
    dashboardSection.style.display = 'none';
    setupAuth();
    return;
  }

  authSection.style.display = 'none';
  dashboardSection.style.display = 'block';

  loadStats();
  setupActions();
  startPolling();
}

function setupAuth() {
  const btn = document.getElementById('connect-btn')!;
  const status = document.getElementById('auth-status')!;
  const input = document.getElementById('api-key') as HTMLInputElement;

  btn.addEventListener('click', async () => {
    const apiKey = input.value.trim();
    if (!apiKey) return;

    status.textContent = 'Connecting...';
    chrome.runtime.sendMessage({ type: 'HANDSHAKE', apiKey }, (res) => {
      if (res?.error) {
        status.textContent = 'Error: ' + res.error;
        status.style.color = '#ef4444';
      } else {
        status.textContent = 'Connected! Refreshing...';
        setTimeout(() => location.reload(), 500);
      }
    });
  });
}

async function loadStats() {
  try {
    const res = await fetch(`${API_BASE}/conversations/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();

    document.getElementById('new-leads')!.textContent = String(data.newLeads ?? 0);
    document.getElementById('waiting')!.textContent = String(data.waitingReplies ?? 0);
    document.getElementById('hot')!.textContent = String(data.hotOpportunities ?? 0);
    document.getElementById('fires')!.textContent = String(data.supportFires ?? 0);
  } catch {
    updateStatus(false);
  }
}

function setupActions() {
  document.getElementById('ai-draft-btn')!.addEventListener('click', async () => {
    const result = document.getElementById('ai-draft-result')!;
    result.style.display = 'block';
    result.textContent = 'Generating draft...';

    // In real implementation, get current conversation ID from parent
    try {
      const res = await fetch(`${API_BASE}/ai/draft`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: 'demo', tone: 'professional' }),
      });
      const data = await res.json();
      result.textContent = data.draft || 'No draft generated.';
    } catch (err: any) {
      result.textContent = 'Error: ' + err.message;
    }
  });

  document.getElementById('sync-btn')!.addEventListener('click', async () => {
    alert('CRM sync triggered. In production, this syncs the current contact.');
  });

  document.getElementById('create-task-btn')!.addEventListener('click', async () => {
    alert('Task creation modal would open here.');
  });
}

function startPolling() {
  setInterval(loadStats, 30000); // Poll every 30s
}

function updateStatus(connected: boolean) {
  const dot = document.getElementById('status-dot')!;
  const text = document.getElementById('conn-status')!;
  dot.className = 'status-dot ' + (connected ? 'ok' : 'err');
  text.textContent = connected ? 'Connected' : 'Disconnected';
}

// Listen for messages from parent (WhatsApp Web page)
window.addEventListener('message', (event) => {
  if (event.data?.type === 'WACC_CONTACT_UPDATE') {
    const contact = event.data.contact;
    document.getElementById('current-contact')!.textContent = contact.name || contact.phone;
    document.getElementById('lead-score')!.textContent = String(contact.leadScore ?? '-');

    const revBadge = document.getElementById('rev-badge')!;
    const riskBadge = document.getElementById('risk-badge')!;

    revBadge.style.display = contact.revenueOpportunity ? 'inline-block' : 'none';
    riskBadge.style.display = contact.supportRisk ? 'inline-block' : 'none';
  }
});

init();
