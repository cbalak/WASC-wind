// Content script injected into web.whatsapp.com
// Captures chat messages and injects the WACC sidebar

const API_BASE = 'http://localhost:3001/api';

let sidebarInjected = false;
let token: string | null = null;

// Get stored token
chrome.storage.local.get(['wacc_token'], (result) => {
  token = result.wacc_token || null;
  init();
});

// Listen for token updates
chrome.storage.onChanged.addListener((changes) => {
  if (changes.wacc_token) {
    token = changes.wacc_token.newValue;
  }
});

function init() {
  if (sidebarInjected) return;

  // Create sidebar iframe
  const iframe = document.createElement('iframe');
  iframe.id = 'wacc-sidebar';
  iframe.src = chrome.runtime.getURL('sidebar.html');
  iframe.style.cssText = `
    position: fixed;
    top: 0;
    right: 0;
    width: 320px;
    height: 100vh;
    border: none;
    border-left: 1px solid #e5e7eb;
    background: white;
    z-index: 9999;
    box-shadow: -2px 0 8px rgba(0,0,0,0.05);
  `;

  document.body.appendChild(iframe);
  sidebarInjected = true;

  // Adjust WhatsApp Web layout
  const app = document.querySelector('#app');
  if (app) {
    (app as HTMLElement).style.marginRight = '320px';
  }

  // Start observing messages
  observeMessages();
}

function observeMessages() {
  // WhatsApp Web uses a complex DOM. We observe the main chat panel for new messages.
  const chatPanel = document.querySelector('div[role="application"]');
  if (!chatPanel) {
    setTimeout(observeMessages, 1000);
    return;
  }

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node instanceof HTMLElement) {
          const msgRow = node.querySelector('[data-id]');
          if (msgRow) {
            extractAndSend(msgRow);
          }
        }
      }
    }
  });

  observer.observe(chatPanel, { childList: true, subtree: true });
}

function extractAndSend(msgEl: Element) {
  if (!token) return;

  // Extract text content
  const textEl = msgEl.querySelector('.selectable-text.copyable-text span');
  const content = textEl?.textContent || '';
  if (!content.trim()) return;

  // Determine sender (outgoing vs incoming)
  const isOutgoing = msgEl.closest('[data-id*="true_"]') !== null || msgEl.closest('.message-out') !== null;
  const senderType = isOutgoing ? 'agent' : 'contact';

  // Extract contact info from chat header
  const header = document.querySelector('header [data-testid="conversation-info-header"]');
  const contactName = header?.textContent || 'Unknown';
  const phoneMatch = document.body.textContent?.match(/\+?[\d\s()-]{7,}/);
  const phoneNumber = phoneMatch ? phoneMatch[0].replace(/\s/g, '') : 'unknown';

  const payload = {
    tenantId: 'temp', // Will be resolved server-side from token
    phoneNumber,
    contactName,
    content,
    senderType,
    timestamp: new Date().toISOString(),
  };

  chrome.runtime.sendMessage({ type: 'CAPTURE_MESSAGE', payload }, (response) => {
    if (response?.error) {
      console.warn('WACC capture failed:', response.error);
    }
  });
}

// Also expose a function for manual sync
(window as any).waccSync = () => {
  const messages = document.querySelectorAll('[data-id]');
  messages.forEach((msg) => extractAndSend(msg));
};
