function App() {
  const [route, setRoute] = React.useState('home');
  const [venueId, setVenueId] = React.useState(null);
  const [storyId, setStoryId] = React.useState(null);
  const [exploreQuery, setExploreQuery] = React.useState('');
  const [exploreLocate, setExploreLocate] = React.useState(false);

  const open = (id) => { setVenueId(id); setRoute('detail'); window.scrollTo(0, 0); };
  const openStory = (id) => { setStoryId(id); setRoute('story'); window.scrollTo(0, 0); };
  const nav = (r) => { if (r === 'explore') { setExploreQuery(''); setExploreLocate(false); } setRoute(r); window.scrollTo(0, 0); };
  const goSearch = (q) => { setExploreQuery(q || ''); setExploreLocate(false); setRoute('explore'); window.scrollTo(0, 0); };
  const goNearMe = () => { setExploreQuery(''); setExploreLocate(true); setRoute('explore'); window.scrollTo(0, 0); };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-page)' }}>
      <Header onNav={nav} active={route === 'detail' ? 'explore' : (route === 'story' ? 'stories' : route)} />
      <main style={{ flex: 1 }}>
        {route === 'home' && <Home onNav={nav} onSearch={goSearch} onNearMe={goNearMe} onOpen={open} />}
        {route === 'explore' && <MapExplore onOpen={open} initialQuery={exploreQuery} autoLocate={exploreLocate} />}
        {route === 'stories' && <Stories onOpenStory={openStory} />}
        {route === 'story' && <StoryDetail id={storyId} onBack={() => nav('stories')} />}
        {route === 'detail' && <VenueDetail id={venueId} onBack={() => nav('explore')} />}
      </main>
      {route !== 'explore' && <Footer />}
    </div>
  );
}
window.App = App;
