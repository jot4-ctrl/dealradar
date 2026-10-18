// Enlace visible para solicitar una recuperación desde el formulario de acceso.
(() => {
  const cfg = window.DEALRADAR_SUPABASE || {};
  if (!cfg.url || !cfg.anonKey) return;
  const addLink = () => {
    const form = document.getElementById('authForm');
    if (!form || form.querySelector('#forgotPasswordLink') || form.querySelector('#authName')) return;
    const link = document.createElement('button');
    link.type = 'button';
    link.id = 'forgotPasswordLink';
    link.className = 'auth-link';
    link.textContent = '¿Olvidaste tu contraseña?';
    link.style.cssText = 'display:block;width:100%;margin-top:12px;text-align:center;';
    form.appendChild(link);
    link.addEventListener('click', async () => {
      const emailInput = form.querySelector('#authEmail');
      const email = emailInput?.value.trim().toLowerCase();
      const note = document.querySelector('.auth-note');
      if (!email) {
        emailInput?.focus();
        if (note) note.textContent = 'Escribí tu email y después elegí “¿Olvidaste tu contraseña?”.';
        return;
      }
      link.disabled = true;
      link.textContent = 'Enviando enlace…';
      try {
        const response = await fetch(`${cfg.url}/auth/v1/recover`, {
          method: 'POST',
          headers: { apikey: cfg.anonKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, redirect_to: 'https://jot4-ctrl.github.io/dealradar/' })
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.msg || data.message || 'No pudimos enviar el enlace.');
        link.textContent = 'Enlace enviado';
        if (note) note.textContent = 'Revisá tu bandeja de entrada y spam. El enlace llega desde DealRadar.';
      } catch (error) {
        link.disabled = false;
        link.textContent = '¿Olvidaste tu contraseña?';
        if (note) note.textContent = error.message;
      }
    });
  };
  new MutationObserver(addLink).observe(document.documentElement, { childList: true, subtree: true });
  addLink();
})();
