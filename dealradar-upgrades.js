(() => {
  const style = document.createElement('style');
  style.textContent = `
    .local-radar { display:grid; grid-template-columns:1.2fr 1fr; gap:14px; margin:18px 0 8px; }
    .local-radar-card { border:1px solid rgba(229,213,245,.95); border-radius:22px; padding:20px; background:linear-gradient(135deg,#24113f,#5b21b6 58%,#c026d3); color:#fff; box-shadow:0 16px 42px rgba(101,42,146,.18); }
    .local-radar-card h2 { margin:0 0 7px; font-size:22px; letter-spacing:-.04em; }
    .local-radar-card p { margin:0; color:#eadfff; font-size:13px; max-width:560px; }
    .local-radar-card strong { color:#52e5c1; }
    .local-radar-link { display:inline-flex; margin-top:13px; color:#24113f; background:#52e5c1; border-radius:10px; padding:8px 11px; font-size:12px; font-weight:850; text-decoration:none; }
    .local-radar-note { border:1px solid #eadff3; border-radius:22px; padding:20px; background:rgba(255,255,255,.72); box-shadow:0 12px 32px rgba(101,42,146,.06); }
    .local-radar-note h3 { margin:0 0 7px; font-size:17px; }
    .local-radar-note p { margin:0; color:#746585; font-size:13px; }
    .city-filter { grid-column:span 1; }
    .freshness { display:inline-flex; align-items:center; gap:5px; margin-top:7px; color:#6d28d9; font-size:11px; font-weight:800; }
    @media (max-width:800px) { .local-radar { grid-template-columns:1fr; } }
    @media (max-width:620px) { .local-radar-card,.local-radar-note { padding:17px; border-radius:18px; } }
  `;
  document.head.appendChild(style);

  const addLocalRadar = () => {
    if (document.querySelector('.local-radar') || !document.querySelector('.hero')) return;
    const section = document.createElement('section');
    section.className = 'local-radar';
    section.innerHTML = `
      <article class="local-radar-card">
        <h2>Radar local · Bahía Blanca</h2>
        <p>Encuentra oportunidades de comercios cercanos como <strong>Makro</strong> y compara sus catálogos con otras cadenas de la ciudad.</p>
        <a class="local-radar-link" href="https://makro.com.ar/ofertas/bahia-blanca/" target="_blank" rel="noopener">Abrir fuente de Makro ↗</a>
      </article>
      <article class="local-radar-note">
        <h3>La ciudad también cuenta</h3>
        <p>DealRadar separa las oportunidades locales de las internacionales. Cuando una fuente no publica el porcentaje exacto, mostramos el catálogo y sus condiciones sin inventar un precio.</p>
      </article>`;
    document.querySelector('.hero').after(section);
  };

  const addCityFilter = async () => {
    const filters = document.querySelector('.filters');
    if (!filters || document.getElementById('cityFilter')) return;
    let cities = [];
    try {
      const response = await fetch('data/coupons.json', { cache: 'no-store' });
      const data = await response.json();
      cities = [...new Set(data.map(item => item.city).filter(city => city && !/^toda /i.test(city)))].sort((a, b) => a.localeCompare(b, 'es'));
    } catch { return; }
    if (!cities.length) return;
    const field = document.createElement('div');
    field.className = 'field city-filter';
    field.innerHTML = '<label for="cityFilter">Ciudad o zona</label><select id="cityFilter"><option value="">Todas</option></select>';
    filters.appendChild(field);
    const select = field.querySelector('select');
    cities.forEach(city => select.insertAdjacentHTML('beforeend', `<option value="${city.replace(/"/g, '&quot;')}">${city}</option>`));
    select.addEventListener('change', () => {
      const search = document.getElementById('search');
      if (!search) return;
      search.value = select.value;
      search.dispatchEvent(new Event('input', { bubbles: true }));
    });
  };

  const addFreshnessLabels = () => {
    document.querySelectorAll('#offers .card').forEach(card => {
      if (card.querySelector('.freshness')) return;
      const footer = card.querySelector('.card-foot span');
      if (!footer) return;
      const text = footer.textContent || '';
      if (/Makro|Kimbino|Bahía Blanca/i.test(text)) {
        const label = document.createElement('span');
        label.className = 'freshness';
        label.textContent = '● Fuente local revisada';
        footer.appendChild(label);
      }
    });
  };

  const boot = () => {
    addLocalRadar();
    addCityFilter();
    addFreshnessLabels();
    const offers = document.getElementById('offers');
    if (offers) new MutationObserver(addFreshnessLabels).observe(offers, { childList: true });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
