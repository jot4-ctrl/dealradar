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
  const redirectUrl = () => 'https://dealradar.site/';
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
    const isRecoveryFlow = () => window.location.hash.includes('type=recovery');
    const showPasswordReset = () => {
      if (!isRecoveryFlow() || document.getElementById('passwordResetModal')) return;
      const style = document.createElement('style');
      style.textContent = '#passwordResetModal{position:fixed;inset:0;z-index:40;display:grid;place-items:center;padding:20px;background:rgba(31,12,54,.55);backdrop-filter:blur(12px)}#passwordResetModal .password-reset-card{width:min(440px,100%);padding:30px;border-radius:24px;background:#fff;box-shadow:0 24px 80px rgba(30,9,58,.35)}#passwordResetModal h2{margin:0 0 8px;color:#25143c}#passwordResetModal p{margin:0 0 20px;color:#6f6687}#passwordResetModal label{display:grid;gap:6px;margin:12px 0;color:#25143c;font-weight:700}#passwordResetModal input{width:100%;box-sizing:border-box;padding:12px;border:1px solid #d8d1e4;border-radius:10px;font:inherit}#passwordResetModal button{width:100%;margin-top:12px}#passwordResetModal .password-reset-message{font-size:13px;margin-top:12px}';
      document.head.appendChild(style);
      const modal = document.createElement('div');
      modal.id = 'passwordResetModal';
      modal.innerHTML = '<div class="password-reset-card" role="dialog" aria-modal="true" aria-labelledby="passwordResetTitle"><div class="auth-mark">%</div><h2 id="passwordResetTitle">Elegí una contraseña nueva</h2><p>La contraseña se actualizará en tu cuenta de DealRadar.</p><form id="passwordResetForm"><label>Nueva contraseña<input id="newPassword" type="password" minlength="6" autocomplete="new-password" required placeholder="Mínimo 6 caracteres"></label><label>Repetir contraseña<input id="confirmPassword" type="password" minlength="6" autocomplete="new-password" required placeholder="Repetí la contraseña"></label><button class="btn auth-submit" type="submit">Guardar contraseña</button></form><p class="password-reset-message" id="passwordResetMessage" aria-live="polite"></p></div>';
      document.body.appendChild(modal);
      document.getElementById('passwordResetForm').addEventListener('submit', async event => {
        event.preventDefault();
        const password = document.getElementById('newPassword').value;
        const confirm = document.getElementById('confirmPassword').value;
        const button = event.target.querySelector('button');
        const message = document.getElementById('passwordResetMessage');
        if (password !== confirm) { message.textContent = 'Las contraseñas no coinciden.'; return; }
        button.disabled = true;
        button.textContent = 'Guardando…';
        const result = await client.auth.updateUser({ password });
        if (result.error) {
          button.disabled = false;
          button.textContent = 'Guardar contraseña';
          message.textContent = result.error.message;
          return;
        }
        message.textContent = 'Contraseña actualizada. Ya podés entrar a DealRadar.';
        localStorage.removeItem('dealradar-account-v1');
        window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
        setTimeout(() => window.location.reload(), 900);
      });
    };
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
      if (isRecoveryFlow()) {
        showPasswordReset();
        return;
      }
      if (window.location.hash.includes('access_token=') || window.location.hash.includes('type=signup')) {
        window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
        window.location.reload();
      }
    };
    client.auth.onAuthStateChange((_event, session) => syncSession(session));
    client.auth.getSession().then(({ data }) => syncSession(data?.session));
    if (isRecoveryFlow()) setTimeout(showPasswordReset, 700);
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
document.write('<script src="auth-bridge-v2.js?build=auth-email-5"><\/script>');

// Fallback sin CDN: funciona en navegadores que bloquean scripts de terceros.
(() => {
  const cfg = window.DEALRADAR_SUPABASE;
  if (!cfg.url || !cfg.anonKey) return;
  const accountKey = 'dealradar-account-v1';
  const redirectUrl = () => 'https://dealradar.site/';

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
