const { Button } = window.DesignSystem_580998;

function Header({ onNav, active }) {
  const [open, setOpen] = React.useState(false);
  const [isNarrow, setIsNarrow] = React.useState(false);

  React.useEffect(() => {
    const mq = window.matchMedia('(max-width: 880px)');
    const on = () => { setIsNarrow(mq.matches); if (!mq.matches) setOpen(false); };
    on(); mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  const go = (key) => { setOpen(false); onNav(key); };

  const link = (key, label) => (
    <button
      onClick={() => go(key)}
      style={{
        background: 'none', border: 'none', cursor: 'pointer',
        fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1.02rem',
        color: active === key ? 'var(--chili-500)' : 'var(--ink-700)',
        padding: '6px 4px', borderBottom: active === key ? '3px solid var(--chili-500)' : '3px solid transparent',
      }}
    >{label}</button>
  );

  const mobileLink = (key, label) => (
    <button
      onClick={() => go(key)}
      style={{
        background: active === key ? 'var(--paper-100)' : 'none', border: 'none', cursor: 'pointer',
        fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.15rem', textAlign: 'left',
        color: active === key ? 'var(--chili-500)' : 'var(--ink-900)',
        padding: '14px 16px', borderRadius: 'var(--radius-md)', width: '100%',
      }}
    >{label}</button>
  );

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 30,
      background: 'rgba(255,251,244,0.92)', backdropFilter: 'blur(10px)',
      borderBottom: '1px solid var(--border-soft)',
    }}>
      <div style={{ width: '100%', padding: '8px 24px 8px 12px', display: 'flex', alignItems: 'center', gap: '24px' }}>
        <button onClick={() => go('home')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="../../assets/logo-momo.svg" alt="" style={{ width: 40, height: 40 }} />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.5rem', letterSpacing: '-.02em' }}>
            <span style={{ color: 'var(--chili-500)' }}>Nepali</span><span style={{ color: 'var(--ink-900)' }}>Eats</span>
          </span>
        </button>

        {!isNarrow && (
          <nav style={{ display: 'flex', gap: '18px', marginLeft: '8px', alignItems: 'center' }}>
            {link('explore', 'Explore')}
            {link('stories', 'Stories')}
            <Button size="sm" variant="primary" iconLeft={<i className="ph ph-plus" />} onClick={() => go('explore')} style={{ marginLeft: '12px' }}>Add a spot</Button>
          </nav>
        )}

        <div style={{ flex: 1 }}></div>

        {!isNarrow && (
          <Button size="sm" variant="outline" iconLeft={<i className="ph ph-user" />} onClick={() => go('explore')}>Log in</Button>
        )}

        {isNarrow && (
          <button
            onClick={() => setOpen((o) => !o)}
            aria-label="Menu"
            style={{
              background: open ? 'var(--ink-900)' : 'transparent', color: open ? '#fff' : 'var(--ink-900)',
              border: '2px solid var(--ink-900)', borderRadius: 'var(--radius-md)',
              width: 44, height: 44, cursor: 'pointer', fontSize: '1.4rem',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none',
            }}
          >
            <i className={open ? 'ph ph-x' : 'ph ph-list'} />
          </button>
        )}
      </div>

      {/* mobile dropdown panel */}
      {isNarrow && open && (
        <React.Fragment>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, top: 57, background: 'rgba(43,26,18,.35)', zIndex: 25 }}></div>
          <div style={{ position: 'absolute', left: 0, right: 0, top: '100%', background: 'var(--bg-page)', borderBottom: '1px solid var(--border-soft)', boxShadow: 'var(--shadow-lg)', padding: '12px 16px 18px', display: 'flex', flexDirection: 'column', gap: 6, zIndex: 26 }}>
            {mobileLink('explore', 'Explore')}
            {mobileLink('stories', 'Stories')}
            <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Button block variant="primary" iconLeft={<i className="ph ph-plus" />} onClick={() => go('explore')}>Add a spot</Button>
              <Button block variant="outline" iconLeft={<i className="ph ph-user" />} onClick={() => go('explore')}>Log in</Button>
            </div>
          </div>
        </React.Fragment>
      )}
    </header>
  );
}

window.Header = Header;
