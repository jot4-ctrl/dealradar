// Acciones de pago con navegación directa, incluso si quedó un script anterior en caché.
(() => {
  const routes = {
    openCheckout: 'https://mpago.la/2dM7wA1',
    payCheckout: 'https://mpago.la/2dM7wA1',
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
