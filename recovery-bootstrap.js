// Recuperación de contraseña: se carga por separado para evitar cachés antiguas.
(() => {
  if (!location.hash.includes('type=recovery') || document.getElementById('passwordResetModal')) return;
  const cfg = window.DEALRADAR_SUPABASE || {};
  const token = new URLSearchParams(location.hash.slice(1)).get('access_token');
  if (!cfg.url || !cfg.anonKey) return;
  const style = document.createElement('style');
  style.textContent = '#passwordResetModal{position:fixed;inset:0;z-index:100;display:grid;place-items:center;padding:20px;background:rgba(31,12,54,.6);backdrop-filter:blur(12px)}#passwordResetModal .password-reset-card{width:min(440px,100%);padding:30px;border-radius:24px;background:#fff;box-shadow:0 24px 80px rgba(30,9,58,.35)}#passwordResetModal h2{margin:0 0 8px;color:#25143c}#passwordResetModal p{margin:0 0 20px;color:#6f6687}#passwordResetModal label{display:grid;gap:6px;margin:12px 0;color:#25143c;font-weight:700}#passwordResetModal input{width:100%;box-sizing:border-box;padding:12px;border:1px solid #d8d1e4;border-radius:10px;font:inherit}#passwordResetModal button{width:100%;margin-top:12px}#passwordResetModal .password-reset-message{font-size:13px;margin-top:12px}';
  document.head.appendChild(style);
  const modal = document.createElement('div');
  modal.id = 'passwordResetModal';
  modal.innerHTML = '<div class="password-reset-card" role="dialog" aria-modal="true"><div class="auth-mark">%</div><h2>Elegí una contraseña nueva</h2><p>La contraseña se actualizará en tu cuenta de DealRadar.</p><form id="passwordResetForm"><label>Nueva contraseña<input id="newPassword" type="password" minlength="6" autocomplete="new-password" required placeholder="Mínimo 6 caracteres"></label><label>Repetir contraseña<input id="confirmPassword" type="password" minlength="6" autocomplete="new-password" required placeholder="Repetí la contraseña"></label><button class="btn auth-submit" type="submit">Guardar contraseña</button></form><p class="password-reset-message" id="passwordResetMessage" aria-live="polite"></p></div>';
  document.body.appendChild(modal);
  modal.querySelector('form').addEventListener('submit', async event => {
    event.preventDefault();
    const password = modal.querySelector('#newPassword').value;
    const confirm = modal.querySelector('#confirmPassword').value;
    const button = modal.querySelector('button');
    const message = modal.querySelector('#passwordResetMessage');
    if (!token) { message.textContent = 'Este enlace está incompleto. Solicitá uno nuevo desde Iniciar sesión.'; return; }
    if (password !== confirm) { message.textContent = 'Las contraseñas no coinciden.'; return; }
    button.disabled = true;
    button.textContent = 'Guardando…';
    try {
      const response = await fetch(`${cfg.url}/auth/v1/user`, { method: 'PUT', headers: { apikey: cfg.anonKey, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.msg || data.message || 'No pudimos actualizar la contraseña.');
      message.textContent = 'Contraseña actualizada. Ya podés entrar a DealRadar.';
      localStorage.removeItem('dealradar-account-v1');
      localStorage.removeItem('dealradar-session-v1');
      history.replaceState({}, document.title, location.pathname + location.search);
      setTimeout(() => location.reload(), 900);
    } catch (error) {
      button.disabled = false;
      button.textContent = 'Guardar contraseña';
      message.textContent = error.message;
    }
  });
})();
