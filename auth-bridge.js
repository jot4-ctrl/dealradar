// Puente de autenticación de DealRadar. Usa la API oficial de Supabase sin dependencias externas.
(() => {
  if (window.__DEALRADAR_AUTH_BRIDGE__) return;
  window.__DEALRADAR_AUTH_BRIDGE__ = true;
  const cfg = window.DEALRADAR_SUPABASE || {};
  if (!cfg.url || !cfg.anonKey) return;
  const accountKey = 'dealradar-account-v1';
  const sessionKey = 'dealradar-session-v1';
  document.addEventListener('submit', async event => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || form.id !== 'authForm') return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    const email = form.querySelector('#authEmail')?.value.trim().toLowerCase();
    const password = form.querySelector('#authPassword')?.value || '';
    const name = form.querySelector('#authName')?.value.trim() || '';
    const signup = Boolean(name);
    const button = form.querySelector('.auth-submit');
    const note = document.querySelector('.auth-note');
    if (!email || !password || !button) return;
    button.disabled = true;
    button.textContent = 'Conectando…';
    try {
      const endpoint = signup ? `${cfg.url}/auth/v1/signup` : `${cfg.url}/auth/v1/token?grant_type=password`;
      const response = await fetch(endpoint, { method: 'POST', headers: { apikey: cfg.anonKey, 'Content-Type': 'application/json' }, body: JSON.stringify(signup ? { email, password, data: { display_name: name } } : { email, password }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error_description || data.msg || data.message || 'No pudimos iniciar sesión.');
      if (data.access_token) localStorage.setItem(sessionKey, JSON.stringify(data));
      localStorage.setItem(accountKey, JSON.stringify({ name: data.user?.user_metadata?.display_name || name || email.split('@')[0], email: data.user?.email || email, createdAt: new Date().toISOString() }));
      if (data.access_token) location.reload();
      else { button.disabled = false; button.textContent = 'Revisá tu email'; if (note) note.textContent = 'Te enviamos un enlace para confirmar la cuenta.'; }
    } catch (error) {
      button.disabled = false;
      button.textContent = signup ? 'Crear mi cuenta' : 'Entrar a mi cuenta';
      if (note) note.textContent = error.message;
    }
  }, true);
})();
