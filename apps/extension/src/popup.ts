const API_BASE = 'http://localhost:3001/api';

async function init() {
  const result = await chrome.storage.local.get(['wacc_token', 'wacc_user', 'wacc_tenant']);

  if (result.wacc_token) {
    showConnected(result.wacc_user, result.wacc_tenant);
  } else {
    showLogin();
  }
}

function showLogin() {
  document.getElementById('login-section')!.style.display = 'block';
  document.getElementById('connected-section')!.style.display = 'none';

  document.getElementById('login-btn')!.addEventListener('click', async () => {
    const email = (document.getElementById('email') as HTMLInputElement).value;
    const password = (document.getElementById('password') as HTMLInputElement).value;
    const status = document.getElementById('login-status')!;

    status.textContent = 'Signing in...';
    status.className = 'status';

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Login failed');

      await chrome.storage.local.set({
        wacc_token: data.accessToken,
        wacc_refresh: data.refreshToken,
        wacc_user: data.user,
        wacc_tenant: data.user.tenant,
      });

      status.textContent = 'Success!';
      status.className = 'status success';
      setTimeout(() => init(), 500);
    } catch (err: any) {
      status.textContent = err.message;
      status.className = 'status error';
    }
  });
}

function showConnected(user: any, tenant: any) {
  document.getElementById('login-section')!.style.display = 'none';
  document.getElementById('connected-section')!.style.display = 'block';

  document.getElementById('user-name')!.textContent = `Signed in as ${user.name}`;
  document.getElementById('tenant-info')!.textContent = `${tenant.name} (${tenant.plan})`;

  document.getElementById('logout-btn')!.addEventListener('click', async () => {
    await chrome.storage.local.remove(['wacc_token', 'wacc_refresh', 'wacc_user', 'wacc_tenant']);
    init();
  });
}

init();
