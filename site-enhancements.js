(() => {
  const copy = {
    es: {
      trust: [['✓','Fuentes enlazadas','Cada oportunidad lleva al sitio donde se publica.'],['◷','Condiciones visibles','País, vigencia, stock y restricciones antes de comprar.'],['⌕','Cobertura global','Filtrá por país, categoría y tipo de ahorro.'],['⌁','Privacidad primero','Tus preferencias quedan bajo tu control.']],
      processTitle:'Cómo trabaja DealRadar', processText:'La página ordena oportunidades de compra y te ayuda a decidir con información suficiente.', process:['Explorá por país, categoría o tienda.','Revisá la fuente y las condiciones de cada oportunidad.','Guardá lo que te interesa y activá alertas en tu dispositivo.','Antes de pagar, confirmá precio, stock, envío e impuestos en la tienda.'],
      faqTitle:'Preguntas frecuentes', faq:[['¿DealRadar vende los productos?','No. DealRadar organiza oportunidades y te dirige al comercio o fuente correspondiente. La compra se completa fuera de DealRadar.'],['¿El precio queda garantizado?','No. Los precios, códigos, stock, envío, impuestos y condiciones pueden cambiar. Verificá siempre el importe final en la tienda.'],['¿Qué significa una fuente verificada?','Significa que la oportunidad incluye un enlace comprobable a una fuente oficial o a la página del comercio. No significa que la promoción sea permanente.'],['¿Puedo elegir otro país?','Sí. Usá el filtro de país para ver las oportunidades disponibles para esa región. Cuando todavía no haya una fuente cargada, el resultado queda vacío en lugar de inventar una oferta.']],
      ctaTitle:'Encontrá una compra mejor informada',ctaText:'Elegí tu país y empezá a comparar oportunidades de la categoría que te interesa.',cta:'Explorar ofertas', footer:'Información clara para comprar mejor.'
    },
    en: {
      trust: [['✓','Linked sources','Every opportunity links to the page where it is published.'],['◷','Clear conditions','Country, validity, stock and restrictions before you buy.'],['⌕','Global coverage','Filter by country, category and saving type.'],['⌁','Privacy first','Your preferences stay under your control.']],
      processTitle:'How DealRadar works', processText:'The app organizes shopping opportunities so you can decide with enough information.', process:['Explore by country, category or store.','Check the source and conditions for each opportunity.','Save what matters and enable device alerts.','Before paying, confirm the final price, stock, shipping and taxes in the store.'],
      faqTitle:'Frequently asked questions', faq:[['Does DealRadar sell products?','No. DealRadar organizes opportunities and sends you to the relevant store or source. The purchase happens outside DealRadar.'],['Is the price guaranteed?','No. Prices, codes, stock, shipping, taxes and conditions may change. Always verify the final amount in the store.'],['What does a verified source mean?','The opportunity includes a checkable link to an official source or store page. It does not mean the promotion is permanent.'],['Can I choose another country?','Yes. Use the country filter to see opportunities available for that region. If no real source is loaded yet, the result stays empty rather than showing an invented offer.']],
      ctaTitle:'Make a better-informed purchase',ctaText:'Choose your country and compare opportunities in the category you care about.',cta:'Explore deals', footer:'Clear information for better shopping.'
    },
    pt: {
      trust: [['✓','Fontes vinculadas','Cada oportunidade leva à página onde foi publicada.'],['◷','Condições claras','País, validade, estoque e restrições antes da compra.'],['⌕','Cobertura global','Filtre por país, categoria e tipo de economia.'],['⌁','Privacidade primeiro','Suas preferências ficam sob seu controle.']],
      processTitle:'Como o DealRadar funciona', processText:'A página organiza oportunidades de compra para você decidir com informação suficiente.', process:['Explore por país, categoria ou loja.','Confira a fonte e as condições de cada oportunidade.','Salve o que interessa e ative alertas no dispositivo.','Antes de pagar, confirme preço final, estoque, envio e impostos na loja.'],
      faqTitle:'Perguntas frequentes', faq:[['O DealRadar vende produtos?','Não. O DealRadar organiza oportunidades e direciona você ao comércio ou fonte correspondente. A compra acontece fora do DealRadar.'],['O preço é garantido?','Não. Preços, cupons, estoque, envio, impostos e condições podem mudar. Confira sempre o valor final na loja.'],['O que é uma fonte verificada?','A oportunidade inclui um link verificável para uma fonte oficial ou página da loja. Isso não significa que a promoção seja permanente.'],['Posso escolher outro país?','Sim. Use o filtro de país para ver as oportunidades disponíveis para aquela região. Sem uma fonte real, o resultado permanece vazio.']],
      ctaTitle:'Encontre uma compra mais informada',ctaText:'Escolha seu país e compare oportunidades da categoria que interessa.',cta:'Explorar ofertas', footer:'Informação clara para comprar melhor.'
    }
  };
  const esc = (value) => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function render() {
    if (document.querySelector('.professional-shell')) return;
    const accountNote = document.querySelector('.auth-note');
    if (accountNote) accountNote.textContent = 'Tu cuenta se gestiona de forma segura. No compartas tu contraseña ni datos de pago.';
    const lang = document.getElementById('lang')?.value || 'es';
    const c = copy[lang] || copy.es;
    const shell = document.createElement('section'); shell.className = 'professional-shell'; shell.setAttribute('aria-label','Información de DealRadar');
    shell.innerHTML = `<div class="professional-trust">${c.trust.map(x=>`<article><i class="trust-icon" aria-hidden="true">${x[0]}</i><div><b>${esc(x[1])}</b><span>${esc(x[2])}</span></div></article>`).join('')}</div><div class="professional-grid"><article class="professional-card"><h2>${esc(c.processTitle)}</h2><p>${esc(c.processText)}</p><ol class="process-list">${c.process.map((x,i)=>`<li><i>${i+1}</i><span>${esc(x)}</span></li>`).join('')}</ol></article><article class="professional-card"><h2>${esc(c.faqTitle)}</h2><div class="faq-list">${c.faq.map(x=>`<details><summary>${esc(x[0])}</summary><p>${esc(x[1])}</p></details>`).join('')}</div></article></div><div class="professional-cta"><div><h2>${esc(c.ctaTitle)}</h2><p>${esc(c.ctaText)}</p></div><a href="#offers">${esc(c.cta)} <span aria-hidden="true">&nbsp;→</span></a></div><footer class="professional-footer"><span>${esc(c.footer)}</span><nav aria-label="Información legal"><a href="privacy.html">Privacidad</a><a href="terms.html">Términos</a><a href="mailto:soporte@dealradar.site">Soporte</a></nav></footer>`;
    const target = document.querySelector('.section.info') || document.querySelector('#offers')?.parentElement;
    if (target) target.after(shell);
  }
  function refresh(){ document.querySelector('.professional-shell')?.remove(); render(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render); else render();
  document.getElementById('lang')?.addEventListener('change', () => setTimeout(refresh, 0));
})();
