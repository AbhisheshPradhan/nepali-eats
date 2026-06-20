const { Button, Badge, Tag, Rating, Avatar } = window.DesignSystem_580998;

const DETAIL_MENU = {
  default: [
    ['Steamed buff momo', '$12'],
    ['Jhol momo (10 pc)', '$15'],
    ['Thakali dal bhat set', '$22'],
    ['Sekuwa platter', '$24'],
    ['Sel roti (3 pc)', '$7'],
  ],
};
const REVIEWS = [
  { name: 'Anish Gurung', when: '2 days ago', rating: 5, text: 'Tastes exactly like home. The jhol momo broth is unreal. Came back twice in one week.' },
  { name: 'Maya Shrestha', when: '1 week ago', rating: 4, text: 'Cosy spot, generous portions. Get there early on weekends, it fills up fast.' },
  { name: 'Tom Whitfield', when: '3 weeks ago', rating: 5, text: 'My first proper Nepali meal and now I\u2019m hooked. Staff walked me through the whole menu.' },
];

function InfoRow({ icon, children }) {
  return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border-soft)' }}>
      <i className={`ph ${icon}`} style={{ color: 'var(--chili-500)', fontSize: '1.3rem' }} />
      <span style={{ color: 'var(--ink-700)' }}>{children}</span>
    </div>
  );
}

function VenueDetail({ id, onBack }) {
  const v = window.NE_DATA.venues.find((x) => x.id === id) || window.NE_DATA.venues[0];
  const status = window.NE_DATA.todayStatus(v);
  const week = window.NE_DATA.weekSchedule(v);
  return (
    <div style={{ maxWidth: 'var(--container)', margin: '0 auto', padding: '20px 24px 0' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-700)', fontFamily: 'var(--font-display)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
        <i className="ph ph-arrow-left" /> Back to spots
      </button>

      {/* hero */}
      <div style={{ height: 280, borderRadius: 'var(--radius-xl)', background: `linear-gradient(135deg, hsl(${v.hue}, 80%, 62%), hsl(${(v.hue+40)%360}, 78%, 52%))`, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'flex-end' }}>
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', opacity: .35, fontSize: '7rem', color: '#fff' }}><i className="ph-fill ph-fork-knife" /></div>
        <div style={{ position: 'relative', padding: '24px 28px', width: '100%', background: 'linear-gradient(transparent, rgba(43,26,18,.7))' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <Badge tone={status.open ? 'open' : 'closed'} solid>{status.open ? 'Open now' : 'Closed'}</Badge>
            <Badge tone="neutral" solid>{v.venueType}</Badge>
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '2.6rem', color: '#fff', margin: 0, lineHeight: 1.05 }}>{v.name}</h1>
        </div>
      </div>

      {/* body grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 320px', gap: '36px', marginTop: '28px', alignItems: 'start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
            <Rating value={v.rating} count={v.reviewCount} size={22} />
            <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{'$'.repeat(v.priceLevel)}</span>
            <span style={{ color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 5 }}><i className="ph ph-map-pin" />{v.suburb} · {v.distance}</span>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
            {v.cuisines.map((c) => <Tag key={c}>{c}</Tag>)}
          </div>
          <p style={{ fontSize: '1.18rem', lineHeight: 1.6, color: 'var(--ink-700)', margin: '0 0 28px' }}>{v.blurb}</p>

          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.5rem', margin: '0 0 8px' }}>Popular dishes</h3>
          <div style={{ background: 'var(--surface-card)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', padding: '8px 20px', marginBottom: 32 }}>
            {DETAIL_MENU.default.map(([dish, price]) => (
              <div key={dish} style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid var(--border-soft)' }}>
                <span style={{ color: 'var(--ink-900)', fontWeight: 500 }}>{dish}</span>
                <span style={{ color: 'var(--chili-600)', fontWeight: 700, fontFamily: 'var(--font-display)' }}>{price}</span>
              </div>
            ))}
          </div>

          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.5rem', margin: '0 0 14px' }}>What people say</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {REVIEWS.map((r) => (
              <div key={r.name} style={{ background: 'var(--surface-card)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', padding: '18px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <Avatar name={r.name} size={40} />
                  <div>
                    <div style={{ fontWeight: 700, fontFamily: 'var(--font-display)' }}>{r.name}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '.85rem' }}>{r.when}</div>
                  </div>
                  <div style={{ marginLeft: 'auto' }}><Rating value={r.rating} showValue={false} size={15} /></div>
                </div>
                <p style={{ margin: 0, color: 'var(--ink-700)', lineHeight: 1.5 }}>{r.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* sidebar */}
        <aside style={{ position: 'sticky', top: 80 }}>
          <div style={{ background: 'var(--surface-card)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)', padding: '20px 22px' }}>
            <Button block variant="primary" iconLeft={<i className="ph ph-navigation-arrow" />} style={{ marginBottom: 10 }}>Get directions</Button>
            <Button block variant="outline" iconLeft={<i className="ph ph-phone" />}>Call the kitchen</Button>

            {/* today's status + full week */}
            <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--border-soft)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <i className="ph ph-clock" style={{ color: status.open ? 'var(--coriander-500)' : 'var(--text-muted)', fontSize: '1.3rem' }} />
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: status.open ? 'var(--coriander-700)' : 'var(--ink-700)' }}>
                  {status.open ? `Open now · until ${status.range.split('–')[1]}` : status.line}
                </span>
              </div>
              {week.map((d) => (
                <div key={d.day} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '0.95rem', fontWeight: d.today ? 700 : 400, color: d.today ? 'var(--ink-900)' : 'var(--ink-700)' }}>
                  <span>{d.day}{d.today ? ' · Today' : ''}</span>
                  <span style={{ color: d.range === 'Closed' ? 'var(--text-muted)' : 'inherit' }}>{d.range}</span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 6, paddingTop: 12, borderTop: '1px solid var(--border-soft)' }}>
              <InfoRow icon="ph-map-pin">{v.suburb}</InfoRow>
              <InfoRow icon="ph-wheelchair">Step-free access</InfoRow>
              <InfoRow icon="ph-leaf">Veg options available</InfoRow>
            </div>
          </div>
          <button onClick={onBack} style={{ width: '100%', marginTop: 14, background: 'var(--marigold-100)', border: 'none', borderRadius: 'var(--radius-lg)', padding: '14px', cursor: 'pointer', color: 'var(--marigold-700)', fontFamily: 'var(--font-display)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <i className="ph ph-heart" /> Save to my list
          </button>
        </aside>
      </div>
    </div>
  );
}
window.VenueDetail = VenueDetail;
