// Puente de autenticación de DealRadar. Usa la API oficial de Supabase sin dependencias externas.
(() => {
  if (window.__DEALRADAR_AUTH_BRIDGE__) return;
  window.__DEALRADAR_AUTH_BRIDGE__ = true;
  const cfg = window.DEALRADAR_SUPABASE || {};
  if (!cfg.url || !cfg.anonKey) return;
  const accountKey = 'dealradar-account-v1';
  const sessionKey = 'dealradar-session-v1';

  // El enlace de recuperación llega con la sesión temporal en el hash.
  // Este formulario funciona aunque el CDN de Supabase tarde en cargar.
  const showRecoveryForm = () => {
    if (!window.location.hash.includes('type=recovery') || document.getElementById('passwordResetModal')) return;
    const token = new URLSearchParams(window.location.hash.replace(/^#/, '')).get('access_token');
    const modal = document.createElement('div');
    modal.id = 'passwordResetModal';
    modal.innerHTML = '<div class="password-reset-card" role="dialog" aria-modal="true" aria-labelledby="passwordResetTitle"><div class="auth-mark">%</div><h2 id="passwordResetTitle">Elegí una contraseña nueva</h2><p>La contraseña se actualizará en tu cuenta de DealRadar.</p><form id="passwordResetForm"><label>Nueva contraseña<input id="newPassword" type="password" minlength="6" autocomplete="new-password" required placeholder="Mínimo 6 caracteres"></label><label>Repetir contraseña<input id="confirmPassword" type="password" minlength="6" autocomplete="new-password" required placeholder="Repetí la contraseña"></label><button class="btn auth-submit" type="submit">Guardar contraseña</button></form><p class="password-reset-message" id="passwordResetMessage" aria-live="polite"></p></div>';
    const style = document.createElement('style');
    style.textContent = '#passwordResetModal{position:fixed;inset:0;z-index:60;display:grid;place-items:center;padding:20px;background:rgba(31,12,54,.6);backdrop-filter:blur(12px)}#passwordResetModal .password-reset-card{width:min(440px,100%);padding:30px;border-radius:24px;background:#fff;box-shadow:0 24px 80px rgba(30,9,58,.35)}#passwordResetModal h2{margin:0 0 8px;color:#25143c}#passwordResetModal p{margin:0 0 20px;color:#6f6687}#passwordResetModal label{display:grid;gap:6px;margin:12px 0;color:#25143c;font-weight:700}#passwordResetModal input{width:100%;box-sizing:border-box;padding:12px;border:1px solid #d8d1e4;border-radius:10px;font:inherit}#passwordResetModal button{width:100%;margin-top:12px}#passwordResetModal .password-reset-message{font-size:13px;margin-top:12px}';
    document.head.appendChild(style);
    document.body.appendChild(modal);
    document.getElementById('passwordResetForm').addEventListener('submit', async event => {
      event.preventDefault();
      const password = document.getElementById('newPassword').value;
      const confirm = document.getElementById('confirmPassword').value;
      const button = event.target.querySelector('button');
      const message = document.getElementById('passwordResetMessage');
      if (!token) { message.textContent = 'Este enlace de recuperación está incompleto. Solicitá uno nuevo desde Iniciar sesión.'; return; }
      if (password !== confirm) { message.textContent = 'Las contraseñas no coinciden.'; return; }
      button.disabled = true;
      button.textContent = 'Guardando…';
      try {
        const response = await fetch(`${cfg.url}/auth/v1/user`, { method: 'PUT', headers: { apikey: cfg.anonKey, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
        const data = await response.json();
        if (!response.ok) throw new Error(data.msg || data.message || 'No pudimos actualizar la contraseña.');
        message.textContent = 'Contraseña actualizada. Ya podés entrar a DealRadar.';
        localStorage.removeItem(accountKey);
        localStorage.removeItem(sessionKey);
        window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
        setTimeout(() => window.location.reload(), 900);
      } catch (error) {
        button.disabled = false;
        button.textContent = 'Guardar contraseña';
        message.textContent = error.message;
      }
    });
  };
  if (window.location.hash.includes('type=recovery')) setTimeout(showRecoveryForm, 250);
  const submit = async event => {
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
      const endpoint = signup
        ? `${cfg.url}/auth/v1/signup?redirect_to=${encodeURIComponent(new URL('./', window.location.href).href)}`
        : `${cfg.url}/auth/v1/token?grant_type=password`;
      const response = await fetch(endpoint, { method: 'POST', headers: { apikey: cfg.anonKey, 'Content-Type': 'application/json' }, body: JSON.stringify(signup ? { email, password, data: { display_name: name } } : { email, password }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error_description || data.msg || data.message || 'No pudimos iniciar sesión.');
      if (data.access_token) {
        localStorage.setItem(sessionKey, JSON.stringify(data));
        localStorage.setItem(accountKey, JSON.stringify({ name: data.user?.user_metadata?.display_name || name || email.split('@')[0], email: data.user?.email || email, createdAt: new Date().toISOString() }));
        location.reload();
      }
      else { button.disabled = false; button.textContent = 'Revisá tu email'; if (note) note.textContent = 'Te enviamos un enlace para confirmar la cuenta.'; }
    } catch (error) {
      button.disabled = false;
      button.textContent = signup ? 'Crear mi cuenta' : 'Entrar a mi cuenta';
      const message = String(error.message || 'No pudimos completar la operación.');
      if (signup && /already registered|already exists|already been registered/i.test(message)) {
        document.getElementById('authMode')?.click();
        if (note) note.innerHTML = 'Esta cuenta ya existe. Iniciá sesión con tu contraseña o usá el correo de recuperación.';
      } else if (note) {
        note.textContent = message;
      }
    }
  };

  const bind = () => {
    const form = document.getElementById('authForm');
    if (!form || form.dataset.externalAuth === '1') return;
    form.onsubmit = null;
    form.addEventListener('submit', submit);
    form.dataset.externalAuth = '1';
  };
  document.addEventListener('submit', submit, true);
  new MutationObserver(bind).observe(document.documentElement, { childList: true, subtree: true });
  setInterval(bind, 250);
  bind();
})();

(() => {
  const sessionKey = 'dealradar-session-v1';
  const accountKey = 'dealradar-account-v1';
  const paymentAlias = 'joaquin.lauci';
  const read = key => {
    try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; }
  };
  const hasValidSession = () => {
    const session = read(sessionKey);
    const token = session?.access_token;
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      return Number(payload.exp || 0) * 1000 > Date.now() + 30000;
    } catch { return false; }
  };
  const isLoggedIn = () => Boolean(read(accountKey) && hasValidSession());
  const clearStaleAccount = () => {
    if (read(accountKey) && !hasValidSession()) {
      localStorage.removeItem(accountKey);
      const accountButton = document.getElementById('accountBtn');
      if (accountButton) accountButton.textContent = 'Iniciar sesión';
    }
  };
  const notify = message => {
    const toast = document.getElementById('toast');
    if (typeof window.toast === 'function') window.toast(message);
    else if (toast) { toast.textContent = message; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 3000); }
  };
  const styles = document.createElement('style');
  styles.textContent = `
    .auth-lock{position:fixed;inset:0;z-index:15;display:grid;place-items:center;padding:20px;background:rgba(31,12,54,.48);backdrop-filter:blur(13px)}
    .auth-lock-card{width:min(520px,100%);padding:34px;border-radius:28px;background:linear-gradient(145deg,#fff,#fff6fc);border:1px solid rgba(255,255,255,.8);box-shadow:0 30px 100px rgba(30,9,58,.35);text-align:center}
    .auth-lock-icon{display:grid;place-items:center;width:58px;height:58px;margin:0 auto 16px;border-radius:19px;background:linear-gradient(135deg,#52e5c1,#c026d3);color:#fff;font-size:25px;font-weight:950;box-shadow:0 10px 24px rgba(192,38,211,.28)}
    .dealradar-locked>.wrap{filter:blur(8px);pointer-events:none;user-select:none}.auth-modal.show~.auth-lock{display:none!important}.auth-lock h2{margin:0;color:#25143c;font-size:30px;letter-spacing:-.06em}.auth-lock p{margin:10px auto 22px;max-width:390px;color:#6f6687}.auth-lock .btn{width:100%;max-width:300px}
    .billing-section{margin:22px 0}.billing-card{display:grid;grid-template-columns:1.25fr 1fr;gap:18px;align-items:stretch;background:linear-gradient(135deg,#29134f,#6d28d9 54%,#f43f8b);border:0;color:#fff;border-radius:25px;padding:24px;box-shadow:0 22px 56px rgba(101,42,146,.2)}
    .billing-card h2{margin:0 0 8px;font-size:25px}.billing-card p{margin:0;color:#f7eaff}.billing-note{margin-top:14px!important;font-size:12px;color:#efdfff!important}.billing-plans{display:grid;grid-template-columns:1fr 1fr;gap:10px}.billing-plan{padding:16px;border-radius:17px;background:rgba(255,255,255,.13);border:1px solid rgba(255,255,255,.22)}.billing-plan strong{display:block;font-size:18px}.billing-plan span{display:block;margin:4px 0 13px;color:#f6dcff;font-size:12px}.billing-plan button{width:100%;border:0;border-radius:10px;padding:10px;background:#52e5c1;color:#1e1234;font-weight:900}.billing-plan button.secondary{background:#fff;color:#6d28d9}.billing-plan button[disabled]{opacity:.62;cursor:not-allowed}.alias-box{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:12px;padding:11px 12px;border-radius:12px;background:rgba(0,0,0,.19);font-family:ui-monospace,Consolas,monospace}.alias-box button{border:0;border-radius:8px;padding:7px 9px;background:#fff;color:#6d28d9;font-weight:850;font-size:12px}@media(max-width:700px){.billing-card{grid-template-columns:1fr}.billing-plans{grid-template-columns:1fr}}
  `;
  document.head.appendChild(styles);
  const authNote = document.querySelector('.auth-note');
  if (authNote) authNote.textContent = 'Cuenta protegida por Supabase. Tus datos de acceso no se guardan en este dispositivo.';
  const createBilling = () => {
    if (document.getElementById('billingSection')) return;
    const section = document.createElement('section');
    section.id = 'billingSection';
    section.className = 'billing-section';
    section.innerHTML = `<div class="billing-card"><div><h2>Acceso premium a DealRadar</h2><p>Desbloqueá el radar completo, guardá tus oportunidades y configurá alertas personalizadas.</p><div class="alias-box"><span>${paymentAlias}</span><button id="copyAlias" type="button">Copiar alias</button></div><p class="billing-note">Pago manual por Mercado Pago o transferencia. Confirmá el importe y las condiciones antes de enviar dinero. Los pagos con tarjeta y otros medios se habilitan al conectar un checkout del proveedor.</p></div><div class="billing-plans"><div class="billing-plan"><strong>Radar mensual</strong><span>Acceso completo durante 30 días</span><button id="payAlias" type="button">Pagar con Mercado Pago</button></div><div class="billing-plan"><strong>Otros medios</strong><span>Tarjetas, débito y billeteras</span><button class="secondary" type="button" disabled>Próximamente</button></div></div></div>`;
    document.querySelector('.filters')?.before(section);
    document.getElementById('copyAlias')?.addEventListener('click', async () => { try { await navigator.clipboard.writeText(paymentAlias); notify(`Alias copiado: ${paymentAlias}`); } catch { notify(paymentAlias); } });
    document.getElementById('payAlias')?.addEventListener('click', () => notify(`Usá el alias ${paymentAlias} en Mercado Pago y verificá el importe antes de confirmar.`));
  };
  const createLock = () => {
    if (document.getElementById('authLock')) return;
    const lock = document.createElement('div');
    lock.id = 'authLock';
    lock.className = 'auth-lock';
    lock.innerHTML = '<div class="auth-lock-card"><div class="auth-lock-icon">%</div><h2>Iniciá sesión para entrar</h2><p>El catálogo, los filtros, favoritos y alertas están disponibles para usuarios registrados.</p><button class="btn auth-submit" id="unlockDealRadar" type="button">Iniciar sesión</button></div>';
    document.body.appendChild(lock);
    document.getElementById('unlockDealRadar').onclick = () => {
      lock.remove();
      document.body.style.overflow = '';
      document.getElementById('accountBtn')?.click();
    };
  };
  const syncAccess = () => {
    clearStaleAccount();
    const ok = isLoggedIn();
    const lock = document.getElementById('authLock');
    const authOpen = document.getElementById('authModal')?.classList.contains('show');
    if (ok || authOpen) { lock?.remove(); createBilling(); document.body.style.overflow = ''; }
    else { if (!lock) createLock(); document.body.style.overflow = 'hidden'; }
  };
  createBilling();
  syncAccess();
  document.addEventListener('click', event => {
    if (event.target?.id !== 'unlockDealRadar') return;
    document.getElementById('authLock')?.remove();
    document.body.style.overflow = '';
    const modal = document.getElementById('authModal');
    if (modal) { modal.classList.add('show'); modal.setAttribute('aria-hidden', 'false'); }
  }, true);
  document.addEventListener('click', event => {
    if (event.target?.id === 'logoutBtn') { localStorage.removeItem(sessionKey); localStorage.removeItem(accountKey); setTimeout(syncAccess, 0); }
  }, true);
  window.addEventListener('storage', syncAccess);
  setInterval(syncAccess, 1000);
})();
