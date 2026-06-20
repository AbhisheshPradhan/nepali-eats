function Footer() {
  const col = (title, items) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>{title}</div>
      {items.map((i) => <a key={i} href="#" onClick={(e)=>e.preventDefault()} style={{ color: 'var(--paper-200)', textDecoration: 'none', fontSize: '.95rem' }}>{i}</a>)}
    </div>
  );
  const flags = ['var(--flag-blue)','var(--flag-white)','var(--flag-red)','var(--flag-green)','var(--flag-yellow)'];
  return (
    <footer style={{ background: 'var(--ink-900)', color: '#fff', marginTop: '64px' }}>
      <div style={{ display: 'flex', height: '10px' }}>
        {Array.from({length: 30}).map((_, i) => <div key={i} style={{ flex: 1, background: flags[i % 5] }} />)}
      </div>
      <div style={{ maxWidth: 'var(--container)', margin: '0 auto', padding: '48px 24px 36px', display: 'flex', gap: '48px', flexWrap: 'wrap' }}>
        <div style={{ maxWidth: 320 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <img src="../../assets/logo-momo.svg" alt="" style={{ width: 36, height: 36 }} />
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.35rem' }}>
              <span style={{ color: 'var(--marigold-500)' }}>Nepali</span><span style={{ color: '#fff' }}>Eats</span>
            </span>
          </div>
          <p style={{ color: 'var(--paper-200)', lineHeight: 1.6, margin: 0 }}>
            Every plate of Nepali food in Australia, gathered with love, from steamy momo windows to Sunday market stalls.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '48px', flexWrap: 'wrap' }}>
          {col('Explore', ['By cuisine', 'By city', 'Food trucks', 'New this week'])}
          {col('Community', ['Add a spot', 'Write a review', 'Our story', 'For owners'])}
          {col('Hungry?', ['Momo guide', 'Where to eat thali', 'Festival eats'])}
        </div>
      </div>
      <div style={{ borderTop: '1px solid rgba(255,255,255,.12)', padding: '18px 24px', textAlign: 'center', color: 'var(--paper-200)', fontSize: '.85rem' }}>
        Made with love for Nepali food in Australia · © 2026 NepaliEats
      </div>
    </footer>
  );
}
window.Footer = Footer;
