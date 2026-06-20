const { Badge, Button } = window.DesignSystem_580998;

function StoryImage({ hue, height, radius = 'var(--radius-lg)', fontSize = '1.8rem' }) {
  return (
    <div style={{ height, borderRadius: radius, background: `linear-gradient(135deg, hsl(${hue},78%,62%), hsl(${(hue + 34) % 360},76%,50%))`, display: 'grid', placeItems: 'center', color: 'rgba(255,255,255,.85)', fontSize, boxShadow: 'var(--shadow-sm)' }}>
      <i className="ph ph-image" />
    </div>
  );
}

function Stories({ onOpenStory }) {
  const posts = window.NE_DATA.stories;
  const featured = posts[0];
  const rest = posts.slice(1);

  return (
    <div style={{ maxWidth: 'var(--container)', margin: '0 auto', padding: '40px 24px 0' }}>
      <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '.82rem', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--chili-500)' }}>Stories</span>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '2.6rem', margin: '6px 0 4px', color: 'var(--ink-900)' }}>Tales from the Nepali table</h1>
      <p style={{ color: 'var(--text-muted)', margin: '0 0 32px', fontSize: '1.15rem', maxWidth: 620 }}>City guides, dish explainers and the people behind the kitchens we love.</p>

      {/* featured */}
      <article onClick={() => onOpenStory(featured.id)} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 28, background: 'var(--surface-card)', borderRadius: 'var(--radius-xl)', overflow: 'hidden', boxShadow: 'var(--shadow-md)', cursor: 'pointer', marginBottom: 40 }}>
        <StoryImage hue={featured.hue} height={'100%'} radius={0} fontSize={'3rem'} />
        <div style={{ padding: '32px 32px 32px 0', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ marginBottom: 12 }}><Badge tone="favourite" solid>{featured.category}</Badge></div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '2rem', lineHeight: 1.1, color: 'var(--ink-900)', margin: '0 0 12px' }}>{featured.title}</h2>
          <p style={{ color: 'var(--ink-700)', fontSize: '1.1rem', lineHeight: 1.55, margin: '0 0 18px' }}>{featured.dek}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-muted)', fontSize: '.92rem' }}>
            <span style={{ fontWeight: 600, color: 'var(--ink-700)' }}>{featured.author}</span>
            <span>·</span><span>{featured.date}</span>
            <span>·</span><span>{featured.readTime}</span>
          </div>
        </div>
      </article>

      {/* grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 26, paddingBottom: 8 }}>
        {rest.map((p) => (
          <article key={p.id} onClick={() => onOpenStory(p.id)} style={{ background: 'var(--surface-card)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)', cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
            <StoryImage hue={p.hue} height={170} radius={0} />
            <div style={{ padding: '18px 20px 22px', display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
              <Badge tone="info">{p.category}</Badge>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.3rem', lineHeight: 1.15, color: 'var(--ink-900)', margin: 0 }}>{p.title}</h3>
              <p style={{ color: 'var(--ink-700)', lineHeight: 1.5, margin: 0, flex: 1 }}>{p.dek}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: '.85rem' }}>
                <span>{p.date}</span><span>·</span><span>{p.readTime}</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function StoryDetail({ id, onBack }) {
  const p = window.NE_DATA.stories.find((s) => s.id === id) || window.NE_DATA.stories[0];
  return (
    <div style={{ maxWidth: 'var(--container-narrow)', margin: '0 auto', padding: '24px 24px 0' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-700)', fontFamily: 'var(--font-display)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 18 }}>
        <i className="ph ph-arrow-left" /> All stories
      </button>
      <div style={{ marginBottom: 14 }}><Badge tone="favourite" solid>{p.category}</Badge></div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '2.8rem', lineHeight: 1.05, color: 'var(--ink-900)', margin: '0 0 14px' }}>{p.title}</h1>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-muted)', fontSize: '.95rem', marginBottom: 24 }}>
        <span style={{ fontWeight: 600, color: 'var(--ink-700)' }}>{p.author}</span>
        <span>·</span><span>{p.date}</span><span>·</span><span>{p.readTime}</span>
      </div>
      <StoryImage hue={p.hue} height={320} fontSize={'3rem'} />
      <p style={{ fontSize: '1.4rem', lineHeight: 1.5, color: 'var(--ink-900)', fontWeight: 500, margin: '28px 0 20px' }}>{p.dek}</p>
      {p.body.map((para, i) => (
        <p key={i} style={{ fontSize: '1.15rem', lineHeight: 1.7, color: 'var(--ink-700)', margin: '0 0 18px' }}>{para}</p>
      ))}
      <div style={{ margin: '32px 0 0', padding: '28px', background: 'var(--ink-900)', borderRadius: 'var(--radius-xl)', textAlign: 'center' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.6rem', color: '#fff', margin: '0 0 14px' }}>Hungry yet?</h3>
        <Button variant="secondary" iconRight={<i className="ph ph-arrow-right" />} onClick={onBack}>Find these spots on the map</Button>
      </div>
    </div>
  );
}

window.Stories = Stories;
window.StoryDetail = StoryDetail;
