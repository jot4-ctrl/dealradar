// Configuración pública de autenticación de DealRadar.
// Esta clave es publicable y está pensada para usarse en el navegador.
window.DEALRADAR_SUPABASE = {
  url: 'https://hfbelrcpgtstkccfwfol.supabase.co',
  anonKey: 'sb_publishable_n-2131IJcET4m_n46i59fA_MgAFnSql'
};

(() => {
  const cfg = window.DEALRADAR_SUPABASE;
  if (!cfg.url || !cfg.anonKey) return;

  const accountKey = 'dealradar-account-v1';
  const redirectUrl = () => new URL('./', window.location.href).href;
  const sources = [
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js',
    'https://unpkg.com/@supabase/supabase-js@2/dist/umd/supabase.min.js'
  ];

  const connect = (index = 0) => {
    if (window.supabase?.createClient) return install(window.supabase.createClient(cfg.url, cfg.anonKey));
    if (!sources[index]) return;
    const script = document.createElement('script');
    script.src = sources[index];
    script.onload = () => window.supabase?.createClient
      ? install(window.supabase.createClient(cfg.url, cfg.anonKey))
      : connect(index + 1);
    script.onerror = () => connect(index + 1);
    document.head.appendChild(script);
  };

  const install = client => {
    window.DEALRADAR_SUPABASE_CLIENT = client;
    let pendingEmail = '';
    const showEmailPending = email => {
      pendingEmail = email;
      const note = document.querySelector('.auth-note');
      if (!note) return;
      note.innerHTML = 'Revisá tu bandeja de entrada y spam. <button type="button" id="resendConfirmation" class="auth-link">Reenviar enlace</button>';
    };
    document.addEventListener('click', async event => {
      if (event.target?.id !== 'resendConfirmation' || !pendingEmail) return;
      event.preventDefault();
      const button = event.target;
      button.disabled = true;
      button.textContent = 'Enviando…';
      const result = await client.auth.resend({ type: 'signup', email: pendingEmail, options: { emailRedirectTo: redirectUrl() } });
      const note = document.querySelector('.auth-note');
      if (result.error) {
        button.disabled = false;
        button.textContent = 'Reenviar enlace';
        if (note) note.textContent = result.error.message;
      } else if (note) {
        note.textContent = 'Enlace reenviado. Revisá también la carpeta de spam.';
      }
    }, true);
    const syncSession = session => {
      const user = session?.user;
      if (!user || !session?.access_token) return;
      localStorage.setItem('dealradar-session-v1', JSON.stringify(session));
      localStorage.setItem(accountKey, JSON.stringify({
        name: user.user_metadata?.display_name || user.email?.split('@')[0] || 'amigo',
        email: user.email || '',
        createdAt: new Date().toISOString()
      }));
      if (window.location.hash.includes('access_token=') || window.location.hash.includes('type=signup')) {
        window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
        window.location.reload();
      }
    };
    client.auth.onAuthStateChange((_event, session) => syncSession(session));
    client.auth.getSession().then(({ data }) => syncSession(data?.session));
    document.addEventListener('submit', async event => {
      if (event.target.id !== 'authForm') return;
      event.preventDefault();
      event.stopImmediatePropagation();
      const form = event.target;
      const email = form.querySelector('#authEmail')?.value.trim();
      const password = form.querySelector('#authPassword')?.value;
      const name = form.querySelector('#authName')?.value.trim();
      const signup = Boolean(name);
      const button = form.querySelector('.auth-submit');
      if (!email || !password || !button) return;
      button.disabled = true;
      button.textContent = 'Conectando…';
      const result = signup
        ? await client.auth.signUp({ email, password, options: { data: { display_name: name }, emailRedirectTo: redirectUrl() } })
        : await client.auth.signInWithPassword({ email, password });
      if (result.error) {
        button.disabled = false;
        button.textContent = signup ? 'Crear mi cuenta' : 'Entrar a mi cuenta';
        const note = document.querySelector('.auth-note');
        if (note) note.textContent = result.error.message;
        return;
      }
      const user = result.data.user;
      if (result.data.session) {
        syncSession(result.data.session);
        location.reload();
      }
      else {
        localStorage.removeItem(accountKey);
        button.disabled = false;
        button.textContent = 'Revisá tu email';
        showEmailPending(email);
      }
    }, true);
    document.addEventListener('click', event => {
      if (event.target?.id === 'logoutBtn') client.auth.signOut();
    }, true);
  };

  connect();
})();

// Carga un puente independiente para evitar interferencias de caché o del formulario local.
document.write('<script src="auth-bridge-v2.js?build=auth-email-2"><\/script>');

// Fallback sin CDN: funciona en navegadores que bloquean scripts de terceros.
(() => {
  const cfg = window.DEALRADAR_SUPABASE;
  if (!cfg.url || !cfg.anonKey) return;
  const accountKey = 'dealradar-account-v1';
  const redirectUrl = () => new URL('./', window.location.href).href;

  document.addEventListener('submit', async event => {
    if (event.target.id !== 'authForm') return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const form = event.target;
    const email = form.querySelector('#authEmail')?.value.trim();
    const password = form.querySelector('#authPassword')?.value;
    const name = form.querySelector('#authName')?.value.trim();
    const signup = Boolean(name);
    const button = form.querySelector('.auth-submit');
    const note = document.querySelector('.auth-note');
    if (!email || !password || !button) return;
    button.disabled = true;
    button.textContent = 'Conectando…';
    const endpoint = signup
      ? `${cfg.url}/auth/v1/signup?redirect_to=${encodeURIComponent(redirectUrl())}`
      : `${cfg.url}/auth/v1/token?grant_type=password`;
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { apikey: cfg.anonKey, 'Content-Type': 'application/json' },
        body: JSON.stringify(signup
          ? { email, password, data: { display_name: name } }
          : { email, password })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error_description || data.msg || data.message || 'No pudimos iniciar sesión.');
      if (data.access_token) localStorage.setItem('dealradar-session-v1', JSON.stringify(data));
      localStorage.setItem(accountKey, JSON.stringify({
        name: data.user?.user_metadata?.display_name || name || email.split('@')[0],
        email: data.user?.email || email,
        createdAt: new Date().toISOString()
      }));
      if (data.access_token) location.reload();
      else {
        button.disabled = false;
        button.textContent = 'Revisá tu email';
        if (note) note.textContent = 'Te enviamos un enlace para confirmar la cuenta.';
      }
    } catch (error) {
      button.disabled = false;
      button.textContent = signup ? 'Crear mi cuenta' : 'Entrar a mi cuenta';
      if (note) note.textContent = error.message;
    }
  }, true);
})();
