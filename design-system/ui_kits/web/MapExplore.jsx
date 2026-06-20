const { Badge, Tag, Rating, Button, Input, PlaceCard } = window.DesignSystem_580998;

const VENUE_ICON = { Restaurant: 'ph-fork-knife', Cafe: 'ph-coffee', 'Food truck': 'ph-truck', Stall: 'ph-storefront' };

/* ---- Leaflet pin (brand teardrop with rating) ---- */
function pinHtml(v, hi) {
  const color = v.favourite ? 'var(--marigold-500)' : 'var(--chili-500)';
  const ring = hi ? '3px solid var(--ink-900)' : '2px solid #fff';
  const scale = hi ? 1.18 : 1;
  return `
    <div style="position:relative;transform:scale(${scale});transition:transform .15s var(--ease-bounce);">
      <div style="width:34px;height:34px;background:${color};border:${ring};border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 4px 10px rgba(43,26,18,.35);"></div>
      <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#fff;font-family:var(--font-display);font-weight:700;font-size:12px;padding-bottom:4px;">${v.rating.toFixed(1)}</div>
    </div>`;
}
function makeIcon(v, hi) {
  return L.divIcon({ html: pinHtml(v, hi), className: '', iconSize: [34, 42], iconAnchor: [17, 40], tooltipAnchor: [0, -34] });
}

function DishCarousel({ hue, count = 5 }) {
  const [i, setI] = React.useState(0);
  const go = (d, e) => { e.stopPropagation(); setI((p) => (p + d + count) % count); };
  const arrow = { position: 'absolute', top: '50%', transform: 'translateY(-50%)', width: 26, height: 26, borderRadius: '50%', background: 'rgba(255,255,255,.92)', border: 'none', cursor: 'pointer', display: 'grid', placeItems: 'center', color: 'var(--ink-900)', boxShadow: 'var(--shadow-sm)', fontSize: '.9rem' };
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, hsl(${(hue + i * 14) % 360},78%,62%), hsl(${(hue + i * 14 + 34) % 360},76%,50%))`, display: 'grid', placeItems: 'center', color: 'rgba(255,255,255,.85)', fontSize: '1.9rem' }}>
        <i className="ph ph-image" />
      </div>
      <button onClick={(e) => go(-1, e)} style={{ ...arrow, left: 8 }}><i className="ph ph-caret-left" /></button>
      <button onClick={(e) => go(1, e)} style={{ ...arrow, right: 8 }}><i className="ph ph-caret-right" /></button>
      <div style={{ position: 'absolute', bottom: 8, left: 0, right: 0, display: 'flex', gap: 5, justifyContent: 'center' }}>
        {Array.from({ length: count }).map((_, d) => (
          <span key={d} style={{ width: 6, height: 6, borderRadius: '50%', background: d === i ? '#fff' : 'rgba(255,255,255,.5)' }} />
        ))}
      </div>
    </div>
  );
}

function CompactRow({ v, hovered, selected, onOpen, onHover, rowRef, narrow }) {
  const hi = hovered || selected;
  const s = window.NE_DATA.todayStatus(v);
  return (
    <article
      ref={rowRef}
      onClick={() => onOpen(v.id)}
      onMouseEnter={() => onHover(v.id)}
      onMouseLeave={() => onHover(null)}
      style={{
        display: 'flex', flexDirection: narrow ? 'column' : 'row', cursor: 'pointer', overflow: 'hidden',
        background: selected ? 'var(--paper-100)' : 'var(--surface-card)',
        border: `2px solid ${hi ? 'var(--chili-500)' : 'var(--border-soft)'}`,
        borderRadius: 'var(--radius-lg)',
        boxShadow: hi ? 'var(--shadow-md)' : 'var(--shadow-sm)',
        transition: 'border-color var(--dur-fast), box-shadow var(--dur-fast), background var(--dur-fast)',
      }}
    >
      <div style={{ position: 'relative', flex: 'none', ...(narrow ? { width: '100%', height: 180 } : { width: 230, alignSelf: 'stretch', minHeight: 190 }) }}>
        <DishCarousel hue={v.hue} count={5} />
        <span style={{ position: 'absolute', top: 10, left: 10, zIndex: 2 }}>
          <Badge tone={s.open ? 'open' : 'closed'} solid style={{ fontSize: '.66rem', padding: '3px 9px' }}>{s.open ? 'Open' : 'Closed'}</Badge>
        </span>
        <span style={{ position: 'absolute', top: 8, right: 8, zIndex: 2, width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,.92)', display: 'grid', placeItems: 'center', color: v.favourite ? 'var(--chili-500)' : 'var(--ink-500)', boxShadow: 'var(--shadow-sm)' }}>
          <i className={v.favourite ? 'ph-fill ph-heart' : 'ph ph-heart'} />
        </span>
      </div>
      <div style={{ flex: 1, minWidth: 0, padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'baseline' }}>
          <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.3rem', color: 'var(--ink-900)', lineHeight: 1.12 }}>{v.name}</h3>
          <span style={{ color: 'var(--text-muted)', fontWeight: 600, flex: 'none' }}>{'$'.repeat(v.priceLevel)}</span>
        </div>
        <Rating value={v.rating} count={v.reviewCount} size={15} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-muted)', fontSize: '.9rem' }}>
          <i className="ph ph-map-pin" style={{ color: 'var(--chili-500)' }} />
          <span>{v.suburb} · {v.distance}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '.9rem', fontWeight: 600, color: s.open ? 'var(--coriander-700)' : 'var(--text-muted)' }}>
          <i className="ph ph-clock" style={{ color: s.open ? 'var(--coriander-500)' : 'var(--text-muted)', flex: 'none' }} />
          <span>{s.open ? `Open · until ${s.range.split('–')[1]}` : s.line}</span>
        </div>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 2 }}>
          {v.cuisines.slice(0, 3).map((c) => <Tag key={c} style={{ fontSize: '.74rem', padding: '3px 10px' }}>{c}</Tag>)}
        </div>
      </div>
    </article>
  );
}

function Seg({ value, onChange, options }) {
  return (
    <div style={{ display: 'flex', border: '2px solid var(--border-strong)', borderRadius: 'var(--radius-pill)', overflow: 'hidden', flex: 'none' }}>
      {options.map(([val, label]) => (
        <button key={String(val)} onClick={() => onChange(val)} style={{
          border: 'none', cursor: 'pointer', padding: '5px 14px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '.9rem',
          background: value === val ? 'var(--chili-500)' : 'transparent',
          color: value === val ? '#fff' : 'var(--ink-700)', transition: 'background var(--dur-fast)',
        }}>{label}</button>
      ))}
    </div>
  );
}

function SearchItem({ icon, title, sub, onPick }) {
  return (
    <button onMouseDown={(e) => { e.preventDefault(); onPick(); }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--paper-100)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
      style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', border: 'none', background: 'transparent', cursor: 'pointer', padding: '10px 16px', fontFamily: 'var(--font-body)' }}>
      <i className={`ph ${icon}`} style={{ color: 'var(--chili-500)', fontSize: '1.15rem', flex: 'none' }} />
      <span style={{ minWidth: 0 }}>
        <span style={{ display: 'block', fontWeight: 600, color: 'var(--ink-900)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</span>
        <span style={{ display: 'block', fontSize: '.82rem', color: 'var(--text-muted)' }}>{sub}</span>
      </span>
    </button>
  );
}

function SearchSection({ label }) {
  return <div style={{ padding: '8px 16px 4px', fontSize: '.72rem', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--text-muted)', background: 'var(--bg-page)' }}>{label}</div>;
}

// Single OpenTable-style box: type → grouped Locations + Restaurants suggestions.
function SearchBox({ data, onPickLocation, onPickVenue, onSubmit }) {
  const [q, setQ] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const ql = q.trim().toLowerCase();
  const titleCase = (s) => s.replace(/\b\w/g, (c) => c.toUpperCase());

  const locs = ql ? Object.entries(data.locations)
    .filter(([k, l]) => k.includes(ql) || l.metro.toLowerCase().includes(ql)).slice(0, 5) : [];
  const vens = ql ? data.venues
    .filter((v) => v.name.toLowerCase().includes(ql) || v.suburb.toLowerCase().includes(ql)).slice(0, 6) : [];
  const show = open && ql.length > 0;

  return (
    <div style={{ position: 'relative', flex: '1 1 360px', maxWidth: 560 }}>
      {/* single pill: icon + input + Search button inside, like the homepage hero */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '2px solid var(--border-strong)', borderRadius: 'var(--radius-pill)', padding: '4px 4px 4px 16px' }}>
        <i className="ph ph-magnifying-glass" style={{ color: 'var(--text-muted)', fontSize: '1.15rem', flex: 'none' }} />
        <input
          value={q}
          placeholder="Search a restaurant, suburb or postcode"
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 160)}
          onKeyDown={(e) => { if (e.key === 'Enter') { onSubmit(q); setOpen(false); } }}
          style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'var(--font-body)', fontSize: '1rem', color: 'var(--ink-900)', minWidth: 0 }} />
        <Button size="sm" variant="primary" onClick={() => { onSubmit(q); setOpen(false); }} style={{ flex: 'none' }}>Search</Button>
      </div>
      {show && (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, background: '#fff', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-soft)', overflow: 'hidden', zIndex: 60, maxHeight: 400, overflowY: 'auto' }}>
          <button onMouseDown={(e) => { e.preventDefault(); onSubmit(q); setOpen(false); }}
            style={{ display: 'block', width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer', background: 'var(--chili-500)', color: '#fff', padding: '11px 16px', fontFamily: 'var(--font-body)', fontWeight: 600 }}>
            <i className="ph ph-magnifying-glass" style={{ marginRight: 8 }} />Search “{q}”
          </button>
          {locs.length > 0 && <SearchSection label="Locations" />}
          {locs.map(([k, l]) => (
            <SearchItem key={k} icon="ph-map-pin" title={titleCase(k)} sub={l.metro}
              onPick={() => { setQ(titleCase(k)); setOpen(false); onPickLocation(k, l); }} />
          ))}
          {vens.length > 0 && <SearchSection label="Restaurants" />}
          {vens.map((v) => (
            <SearchItem key={v.id} icon="ph-fork-knife" title={v.name} sub={`${v.suburb} · ${v.venueType}`}
              onPick={() => { setQ(v.name); setOpen(false); onPickVenue(v); }} />
          ))}
          {locs.length === 0 && vens.length === 0 && (
            <div style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>No matches — try another name or suburb.</div>
          )}
        </div>
      )}
    </div>
  );
}

function MapExplore({ onOpen, initialQuery = '', autoLocate = false }) {
  const data = window.NE_DATA;
  const [metro, setMetro] = React.useState(data.defaultMetro);
  const [textFilter, setTextFilter] = React.useState('');
  const [price, setPrice] = React.useState(0);
  const [minRating, setMinRating] = React.useState(0);
  const [sort, setSort] = React.useState('featured');
  const [openOnly, setOpenOnly] = React.useState(true);
  const [hovered, setHovered] = React.useState(null);
  const [selected, setSelected] = React.useState(null);
  const [viewMode, setViewMode] = React.useState('map');
  const [isNarrow, setIsNarrow] = React.useState(false);

  const mapRef = React.useRef(null);
  const mapEl = React.useRef(null);
  const layerRef = React.useRef(null);
  const markersRef = React.useRef({});
  const listEl = React.useRef(null);
  const cardEls = React.useRef({});

  const tf = textFilter.trim().toLowerCase();
  const venues = data.venues.filter((v) =>
    (metro === 'All' || v.metro === metro) &&
    (price === 0 || v.priceLevel === price) &&
    (v.rating >= minRating) &&
    (!openOnly || window.NE_DATA.todayStatus(v).open) &&
    (tf === '' || v.name.toLowerCase().includes(tf) || v.suburb.toLowerCase().includes(tf) || v.cuisines.some((c) => c.toLowerCase().includes(tf)))
  );

  const sorted = [...venues];
  if (sort === 'rating') sorted.sort((a, b) => b.rating - a.rating);
  else if (sort === 'distance') sorted.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
  else if (sort === 'newest') sorted.sort((a, b) => b.id - a.id);

  /* responsive */
  React.useEffect(() => {
    const mq = window.matchMedia('(max-width: 880px)');
    const on = () => setIsNarrow(mq.matches);
    on(); mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  /* init map once */
  React.useEffect(() => {
    const loc = data.locations[data.defaultMetro.toLowerCase()] || { center: [-33.815, 150.985], zoom: 11 };
    const map = L.map(mapEl.current, { zoomControl: true, scrollWheelZoom: true, attributionControl: true }).setView(loc.center, loc.zoom);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap · © CARTO', subdomains: 'abcd', maxZoom: 19,
    }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    setTimeout(() => { map.invalidateSize(); if (metro === 'All') fitAll(); }, 60);
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  /* (re)build markers when filtered set changes */
  React.useEffect(() => {
    const map = mapRef.current; if (!map || !layerRef.current) return;
    layerRef.current.clearLayers();
    markersRef.current = {};
    venues.forEach((v) => {
      const m = L.marker([v.lat, v.lng], { icon: makeIcon(v, false) });
      m.bindTooltip(v.name, { direction: 'top', offset: [0, -34] });
      m.on('click', () => {
        setSelected(v.id);
        map.panTo([v.lat, v.lng], { animate: true });
        const el = cardEls.current[v.id];
        if (el && listEl.current) listEl.current.scrollTo({ top: el.offsetTop - 12, behavior: 'smooth' });
      });
      m.on('mouseover', () => setHovered(v.id));
      m.on('mouseout', () => setHovered(null));
      m.addTo(layerRef.current);
      markersRef.current[v.id] = m;
    });
  }, [metro, textFilter, price, minRating, openOnly]);

  /* update highlight imperatively */
  React.useEffect(() => {
    venues.forEach((v) => {
      const m = markersRef.current[v.id]; if (!m) return;
      const hi = v.id === hovered || v.id === selected;
      m.setIcon(makeIcon(v, hi));
      m.setZIndexOffset(hi ? 1000 : 0);
    });
  }, [hovered, selected, metro, textFilter, price, minRating, openOnly]);

  const fitAll = () => {
    const map = mapRef.current; if (!map) return;
    const pts = data.venues.map((v) => [v.lat, v.lng]);
    map.flyToBounds(L.latLngBounds(pts).pad(0.2), { duration: 0.8 });
  };

  /* pick a location from the search dropdown — recenter the map */
  const pickLocation = (key, loc) => {
    setMetro(loc.metro); setTextFilter(''); setSelected(null);
    if (mapRef.current) mapRef.current.flyTo(loc.center, loc.zoom, { duration: 0.8 });
  };

  /* pick a restaurant from the search dropdown — open its page */
  const pickVenue = (v) => onOpen(v.id);

  /* free-text submit: jump to a matching location, else filter the list */
  const submitSearch = (raw) => {
    const key = (raw || '').trim().toLowerCase();
    if (!key) { setTextFilter(''); return; }
    if (key === 'australia' || key === 'all') { setMetro('All'); setTextFilter(''); fitAll(); return; }
    const entry = data.locations[key] || Object.entries(data.locations).find(([k]) => k.includes(key));
    const loc = Array.isArray(entry) ? entry[1] : entry;
    if (loc) { setMetro(loc.metro); setTextFilter(''); setSelected(null); if (mapRef.current) mapRef.current.flyTo(loc.center, loc.zoom, { duration: 0.8 }); }
    else { setTextFilter(key); }
  };

  /* run the hero search / locate once on entry */
  React.useEffect(() => {
    if (autoLocate) setTimeout(() => nearMe(), 200);
    else if (initialQuery) setTimeout(() => submitSearch(initialQuery), 120);
  }, []);
  const nearMe = () => {
    const map = mapRef.current; if (!map) return;
    setMetro('Sydney');
    const syd = data.locations['sydney'];
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => map.flyTo([p.coords.latitude, p.coords.longitude], 13, { duration: 0.8 }),
        () => map.flyTo(syd.center, syd.zoom, { duration: 0.8 }),
        { timeout: 3000 }
      );
    } else map.flyTo(syd.center, syd.zoom, { duration: 0.8 });
  };

  React.useEffect(() => {
    if (viewMode === 'map' && mapRef.current) setTimeout(() => mapRef.current.invalidateSize(), 60);
  }, [viewMode, isNarrow]);

  const locLabel = `${venues.length} ${venues.length === 1 ? 'spot' : 'spots'}${metro !== 'All' ? ` in ${metro}` : ' across Australia'}`;
  const emptyState = (
    <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
      <div style={{ fontSize: '2.2rem' }}><i className="ph ph-cooking-pot" /></div>
      No spots here yet — try another area or filter.
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 57px)' }}>
      {/* top bar — full width, two rows */}
      <div style={{ padding: '12px 24px', borderBottom: '1px solid var(--border-soft)', background: 'var(--bg-warm)', position: 'relative', zIndex: 1200 }}>
        {/* row 1 — search + actions + view toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <SearchBox data={data} onPickLocation={pickLocation} onPickVenue={pickVenue} onSubmit={submitSearch} />
          <Button size="sm" variant="primary" iconLeft={<i className="ph ph-navigation-arrow" />} onClick={nearMe} style={{ flex: 'none', whiteSpace: 'nowrap' }}>Near me</Button>
        </div>
        {/* row 2 — sort + price + rating filters */}
        <div style={{ display: 'flex', gap: 22, alignItems: 'center', marginTop: 12, flexWrap: 'wrap' }}>
          <button onClick={() => setOpenOnly((o) => !o)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 7, border: '2px solid', borderColor: openOnly ? 'var(--coriander-500)' : 'var(--border-strong)', background: openOnly ? 'var(--coriander-500)' : '#fff', color: openOnly ? '#fff' : 'var(--ink-700)', borderRadius: 'var(--radius-pill)', padding: '5px 16px', cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '.9rem', transition: 'all var(--dur-fast)' }}>
            <i className="ph-fill ph-clock" />Open now
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--ink-700)', fontSize: '.9rem' }}>Sort</span>
            <div style={{ position: 'relative' }}>
              <select value={sort} onChange={(e) => setSort(e.target.value)}
                style={{ appearance: 'none', WebkitAppearance: 'none', border: '2px solid var(--border-strong)', borderRadius: 'var(--radius-pill)', background: '#fff', padding: '5px 34px 5px 14px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '.9rem', color: 'var(--ink-900)', cursor: 'pointer', outline: 'none' }}>
                <option value="featured">Featured</option>
                <option value="rating">Highest rated</option>
                <option value="distance">Distance</option>
                <option value="newest">Newest</option>
              </select>
              <i className="ph ph-caret-down" style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--ink-700)' }} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--ink-700)', fontSize: '.9rem' }}>Price</span>
            <Seg value={price} onChange={setPrice} options={[[0, 'Any'], [1, '$'], [2, '$$'], [3, '$$$']]} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--ink-700)', fontSize: '.9rem' }}>Rating</span>
            <Seg value={minRating} onChange={setMinRating} options={[[0, 'Any'], [4, '★ 4.0+'], [4.5, '★ 4.5+']]} />
          </div>
        </div>
      </div>

      {/* body */}
      <div style={{ flex: 1, minHeight: 0, position: 'relative', display: 'flex' }}>
        {/* card list — desktop always; mobile only in list mode */}
        {(!isNarrow || viewMode === 'list') && (
          <div ref={listEl} style={{ width: isNarrow ? '100%' : 540, flex: 'none', overflowY: 'auto', padding: 16, background: 'var(--bg-page)', borderRight: isNarrow ? 'none' : '1px solid var(--border-soft)' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--ink-700)', padding: '0 2px 12px' }}>{locLabel}</div>
            {venues.length === 0 ? emptyState : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
                {sorted.map((v) => (
                  <CompactRow key={v.id} v={v} narrow={isNarrow} hovered={hovered === v.id} selected={selected === v.id}
                    onOpen={onOpen} onHover={setHovered}
                    rowRef={(el) => { cardEls.current[v.id] = el; }} />
                ))}
              </div>
            )}
          </div>
        )}
        {/* map — desktop always; mobile only in map mode (kept mounted via display) */}
        <div style={{ flex: 1, position: 'relative', minWidth: 0, display: (!isNarrow || viewMode === 'map') ? 'block' : 'none' }}>
          <div ref={mapEl} style={{ position: 'absolute', inset: 0 }}></div>
        </div>

        {/* floating view toggle — mobile only, sticky bottom-center */}
        {isNarrow && (
          <div style={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 1100 }}>
            <button
              onClick={() => setViewMode(viewMode === 'map' ? 'list' : 'map')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--ink-900)', color: '#fff', border: 'none', borderRadius: 'var(--radius-pill)', padding: '13px 24px', cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.02rem', boxShadow: 'var(--shadow-lg)' }}>
              <i className={`ph ${viewMode === 'map' ? 'ph-rows' : 'ph-map-trifold'}`} style={{ fontSize: '1.2rem' }} />
              {viewMode === 'map' ? 'List' : 'Map'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
window.MapExplore = MapExplore;
