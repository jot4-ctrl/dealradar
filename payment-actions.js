// Acciones de pago con navegación directa, incluso si quedó un script anterior en caché.
(() => {
  const routes = {
    openCheckout: './payment.html',
    payCheckout: './payment.html',
    refreshPayment: './payment.html?status=verify'
  };
  document.addEventListener('click', event => {
    const button = event.target.closest?.('[id]');
    const route = button && routes[button.id];
    if (!route) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    window.location.assign(route);
  }, true);
})();
