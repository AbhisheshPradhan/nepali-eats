// NepaliEats sample venue data (demo only)
window.NE_DATA = {
  cuisines: ['Momo', 'Thakali', 'Newari', 'Sel roti', 'Sekuwa', 'Chatpate', 'Dal bhat', 'Veg-friendly', 'Sweets'],

  // Default map focus = western Sydney, the heart of Nepali Australia.
  defaultMetro: 'Sydney',

  // Opening-hours templates. Index 0=Sun … 6=Sat. null = closed that day.
  schedules: {
    resto:  ['12:00-21:00', null, '11:30-21:30', '11:30-21:30', '11:30-21:30', '11:30-22:00', '11:30-22:00'],
    daily:  ['11:00-21:00', '11:00-21:00', '11:00-21:00', '11:00-21:00', '11:00-22:00', '11:00-22:00', '11:00-22:00'],
    cafe:   ['08:00-15:00', '07:30-16:00', '07:30-16:00', '07:30-16:00', '07:30-16:00', '07:30-16:30', '08:00-16:30'],
    truck:  ['11:00-20:00', null, null, null, null, '16:00-21:00', '11:00-21:00'],
  },

  // Suburb / postcode lookup for search. Keys are lowercase.
  locations: {
    'sydney':       { metro: 'Sydney',    center: [-33.815, 150.985], zoom: 11 },
    'western sydney':{ metro: 'Sydney',   center: [-33.815, 150.95],  zoom: 11 },
    'parramatta':   { metro: 'Sydney',    center: [-33.815, 151.000], zoom: 13 },
    '2150':         { metro: 'Sydney',    center: [-33.820, 151.003], zoom: 13 },
    'harris park':  { metro: 'Sydney',    center: [-33.823, 151.005], zoom: 14 },
    'rooty hill':   { metro: 'Sydney',    center: [-33.770, 150.841], zoom: 13 },
    '2766':         { metro: 'Sydney',    center: [-33.770, 150.841], zoom: 13 },
    'blacktown':    { metro: 'Sydney',    center: [-33.771, 150.906], zoom: 13 },
    '2148':         { metro: 'Sydney',    center: [-33.771, 150.906], zoom: 13 },
    'westmead':     { metro: 'Sydney',    center: [-33.807, 150.987], zoom: 14 },
    'liverpool':    { metro: 'Sydney',    center: [-33.920, 150.924], zoom: 13 },
    'strathfield':  { metro: 'Sydney',    center: [-33.877, 151.095], zoom: 14 },
    'melbourne':    { metro: 'Melbourne', center: [-37.805, 144.910], zoom: 12 },
    'footscray':    { metro: 'Melbourne', center: [-37.800, 144.900], zoom: 14 },
    '3011':         { metro: 'Melbourne', center: [-37.800, 144.900], zoom: 14 },
    'sunshine':     { metro: 'Melbourne', center: [-37.788, 144.833], zoom: 14 },
    'brisbane':     { metro: 'Brisbane',  center: [-27.470, 153.010], zoom: 12 },
    'adelaide':     { metro: 'Adelaide',  center: [-34.928, 138.600], zoom: 12 },
    'canberra':     { metro: 'Canberra',  center: [-35.281, 149.130], zoom: 12 },
  },

  venues: [
    { id: 1, name: 'Himalayan Momo House', metro: 'Sydney', venueType: 'Restaurant', sched: 'resto', cuisines: ['Momo','Newari','Thakali'], rating: 4.7, reviewCount: 212, suburb: 'Rooty Hill, NSW', distance: '1.2 km', priceLevel: 2, favourite: true, hue: 18, lat: -33.7702, lng: 150.8412,
      blurb: 'A family kitchen turning out steamer after steamer of jhol momo. The buff momo here have a cult following across western Sydney.' },
    { id: 3, name: 'Thakali Kitchen', metro: 'Sydney', venueType: 'Restaurant', sched: 'daily', cuisines: ['Thakali','Dal bhat'], rating: 4.8, reviewCount: 140, suburb: 'Harris Park, NSW', distance: '0.8 km', priceLevel: 2, favourite: true, hue: 35, lat: -33.8235, lng: 151.0048,
      blurb: 'A proper Thakali thali set: black dal, gundruk, and as many refills as you can handle. Comfort in a steel plate.' },
    { id: 8, name: 'Momo Station', metro: 'Sydney', venueType: 'Food truck', sched: 'truck', cuisines: ['Momo','Chatpate'], rating: 4.6, reviewCount: 73, suburb: 'Parramatta, NSW', distance: '0.5 km', priceLevel: 1, favourite: true, hue: 28, lat: -33.8150, lng: 151.0010,
      blurb: 'A truck that only does momo: steamed, fried, jhol, C-momo. They do it exceptionally well.' },
    { id: 9, name: 'Kathmandu Kitchen', metro: 'Sydney', venueType: 'Restaurant', sched: 'resto', cuisines: ['Momo','Dal bhat','Newari'], rating: 4.5, reviewCount: 110, suburb: 'Blacktown, NSW', distance: '2.4 km', priceLevel: 2, favourite: false, hue: 12, lat: -33.7711, lng: 150.9061,
      blurb: 'Big portions, bigger welcome. The samay baji platter is the move when you bring a hungry crew.' },
    { id: 10, name: 'Sano Sansar Cafe', metro: 'Sydney', venueType: 'Cafe', sched: 'cafe', cuisines: ['Sweets','Momo','Chatpate'], rating: 4.2, reviewCount: 57, suburb: 'Westmead, NSW', distance: '1.1 km', priceLevel: 1, favourite: false, hue: 205, lat: -33.8071, lng: 150.9872,
      blurb: 'Milky masala chiya, juju dhau and a counter of barfi. A small-world spot for an afternoon catch-up.' },
    { id: 11, name: 'Gorkha Grill', metro: 'Sydney', venueType: 'Restaurant', sched: 'daily', cuisines: ['Sekuwa','Thakali','Momo'], rating: 4.6, reviewCount: 132, suburb: 'Liverpool, NSW', distance: '5.5 km', priceLevel: 2, favourite: true, hue: 4, lat: -33.9201, lng: 150.9241,
      blurb: 'Charcoal sekuwa skewers smoking out the back. Go for the mutton, stay for the achaar.' },
    { id: 12, name: "Didi's Momo", metro: 'Sydney', venueType: 'Stall', sched: 'truck', cuisines: ['Momo','Chatpate'], rating: 4.7, reviewCount: 64, suburb: 'Strathfield, NSW', distance: '3.2 km', priceLevel: 1, favourite: false, hue: 30, lat: -33.8772, lng: 151.0951,
      blurb: 'A weekend stall with a queue that says everything. Steamed momo and a chatpate that bites back.' },
    { id: 2, name: 'Newa Lahana', metro: 'Melbourne', venueType: 'Restaurant', sched: 'resto', cuisines: ['Newari','Sekuwa','Dal bhat'], rating: 4.9, reviewCount: 167, suburb: 'Sunshine, VIC', distance: '2.6 km', priceLevel: 3, favourite: false, hue: 350, lat: -37.7881, lng: 144.8331,
      blurb: 'The full Newari spread: samay baji platters, fiery choila and bara cooked the way Kathmandu grandmothers intended.' },
    { id: 4, name: 'Yak & Yeti Express', metro: 'Melbourne', venueType: 'Food truck', sched: 'truck', cuisines: ['Sel roti','Chatpate','Veg-friendly'], rating: 4.4, reviewCount: 86, suburb: 'Footscray, VIC', distance: '3.0 km', priceLevel: 1, favourite: false, hue: 168, lat: -37.8001, lng: 144.9001,
      blurb: 'Weekend-market legend. Sweet sel roti fried to order and chatpate mixed in front of you. Cash kept handy.' },
    { id: 5, name: 'Everest Cafe', metro: 'Brisbane', venueType: 'Cafe', sched: 'cafe', cuisines: ['Sweets','Momo','Veg-friendly'], rating: 4.3, reviewCount: 98, suburb: 'Auchenflower, QLD', distance: '4.1 km', priceLevel: 1, favourite: false, hue: 210, lat: -27.4751, lng: 153.0001,
      blurb: 'Milky masala chiya, juju dhau and a counter of barfi. The neighbourhood spot for an afternoon catch-up.' },
    { id: 6, name: 'Pokhara Grill', metro: 'Adelaide', venueType: 'Restaurant', sched: 'resto', cuisines: ['Sekuwa','Momo','Thakali'], rating: 4.5, reviewCount: 121, suburb: 'Adelaide, SA', distance: '1.9 km', priceLevel: 2, favourite: false, hue: 6, lat: -34.9286, lng: 138.6001,
      blurb: 'Charcoal sekuwa skewers smoking out the back, lakeside-Pokhara vibes out front. Go for the mutton.' },
    { id: 7, name: 'Annapurna Spice', metro: 'Canberra', venueType: 'Restaurant', sched: 'daily', cuisines: ['Dal bhat','Veg-friendly'], rating: 4.2, reviewCount: 64, suburb: 'Canberra, ACT', distance: '2.2 km', priceLevel: 2, favourite: false, hue: 45, lat: -35.2810, lng: 149.1301,
      blurb: 'Generous veg thali and a quiet dining room. A reliable hug of a meal after a long day.' },
  ],
};

/* ---------- opening-hours helpers ---------- */
(function () {
  const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const fmt = (t) => {
    let [h, m] = t.split(':').map(Number);
    const ap = h < 12 ? 'am' : 'pm';
    let hh = h % 12; if (hh === 0) hh = 12;
    return m === 0 ? `${hh}${ap}` : `${hh}:${String(m).padStart(2, '0')}${ap}`;
  };
  const range = (slot) => `${fmt(slot.split('-')[0])}–${fmt(slot.split('-')[1])}`;

  // Today's open/closed status + label for a venue.
  window.NE_DATA.todayStatus = function (v, now = new Date()) {
    const sched = window.NE_DATA.schedules[v.sched] || window.NE_DATA.schedules.daily;
    const slot = sched[now.getDay()];
    if (!slot) return { open: false, range: 'Closed today', line: 'Closed today' };
    const cur = now.getHours() * 60 + now.getMinutes();
    const [o, c] = slot.split('-');
    const open = cur >= toMin(o) && cur < toMin(c);
    let line;
    if (open) line = `Open · until ${fmt(c)}`;
    else if (cur < toMin(o)) line = `Closed · opens ${fmt(o)}`;
    else line = 'Closed · opens tomorrow';
    return { open, range: range(slot), line };
  };

  // Full week, ordered Mon→Sun, with today flagged.
  window.NE_DATA.weekSchedule = function (v, now = new Date()) {
    const sched = window.NE_DATA.schedules[v.sched] || window.NE_DATA.schedules.daily;
    const names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const order = [1, 2, 3, 4, 5, 6, 0];
    const today = now.getDay();
    return order.map((i) => ({ day: names[i], range: sched[i] ? range(sched[i]) : 'Closed', today: i === today }));
  };
})();

/* ---------- Stories / blog (demo content) ---------- */
window.NE_DATA.stories = [
  { id: 's1', category: 'City guide', hue: 18, readTime: '6 min read', author: 'Maya Shrestha', date: 'June 2026',
    title: 'Where to eat momo in western Sydney', dek: 'Harris Park to Rooty Hill: the steamy windows, the jhol momo, and the queues worth joining.',
    body: ['Western Sydney is, quietly, the momo capital of Australia. On any given evening the steamers are fogging up windows from Parramatta to Blacktown, and the only hard part is choosing.',
      'Start in Harris Park, where Thakali Kitchen plates a dal bhat set that locals drive across the city for. A few suburbs west, Himalayan Momo House has built a cult around its buff momo. Order the jhol, the soupy cousin that arrives swimming in a sesame-tomato broth.',
      'The rule of thumb: follow the queues, bring cash for the trucks, and never skip the achaar.'] },
  { id: 's2', category: 'Dish guide', hue: 35, readTime: '5 min read', author: 'NepaliEats', date: 'May 2026',
    title: 'A beginner’s guide to Nepali food', dek: 'New to momo, dal bhat and sel roti? Here’s how to order your first proper Nepali meal.',
    body: ['Nepali food rewards the curious. If you only know momo, you are standing at the doorway of a much bigger, more generous kitchen.',
      'Begin with dal bhat: lentils, rice and a rotating cast of vegetable and pickle sides, the everyday meal that anchors the whole cuisine. Then branch into the Newari table: choila, bara, and samay baji platters built for sharing.',
      'Wash it down with milky masala chiya, and if there’s sel roti at the counter, get one. It’s a sweet, ring-shaped rice bread that tastes like celebration.'] },
  { id: 's3', category: 'Spotlight', hue: 350, readTime: '4 min read', author: 'Anish Gurung', date: 'May 2026',
    title: 'The family behind Newa Lahana', dek: 'In Sunshine, a Melbourne kitchen is cooking the way Kathmandu grandmothers intended.',
    body: ['Newa Lahana didn’t set out to be a destination. It started as a way for one family to cook the Newari food they missed, and the city came knocking.',
      'The samay baji platter is the heart of the menu: beaten rice, fiery choila, egg, soybeans and more, each element with its own role. It’s a meal that asks you to slow down.',
      'Come hungry, come with friends, and let them bring you whatever is freshest that day.'] },
  { id: 's4', category: 'Festival eats', hue: 168, readTime: '5 min read', author: 'Maya Shrestha', date: 'April 2026',
    title: 'Sel roti season: a sweet tradition', dek: 'During Tihar and Dashain, the markets fill with the smell of sel roti frying. Here’s where to find it.',
    body: ['There’s a particular smell to festival season — rice batter hitting hot oil, curling into golden rings of sel roti. For many Nepali Australians it’s the smell of home.',
      'Around Tihar and Dashain, weekend markets and food trucks like Yak & Yeti Express fry sel roti to order. Sweet, slightly crisp, best eaten warm in your hand.',
      'Keep an eye on the NepaliEats map during festival weeks; the pop-ups don’t last long.'] },
];
