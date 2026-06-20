// Search locations covering Australia. Nepali restaurants cluster in metro
// areas and specific migrant-dense suburbs, so we search capitals + regional
// cities + known Nepali-community suburbs. Overlap is fine — results are
// deduped by Google place feature-ID downstream.
export const LOCATIONS = [
  // National / state-level sweeps (broad nets)
  "Australia",
  "New South Wales",
  "Victoria",
  "Queensland",
  "Western Australia",
  "South Australia",
  "Tasmania",
  "Australian Capital Territory",
  "Northern Territory",

  // NSW
  "Sydney NSW",
  "Parramatta NSW",
  "Blacktown NSW",
  "Liverpool NSW",
  "Rockdale NSW",
  "Auburn NSW",
  "Harris Park NSW",
  "Westmead NSW",
  "Campbelltown NSW",
  "Penrith NSW",
  "Bankstown NSW",
  "Hornsby NSW",
  "Newcastle NSW",
  "Wollongong NSW",
  "Coffs Harbour NSW",
  "Wagga Wagga NSW",
  "Albury NSW",
  "Tamworth NSW",
  "Dubbo NSW",
  "Port Macquarie NSW",

  // VIC
  "Melbourne VIC",
  "Footscray VIC",
  "Sunshine VIC",
  "Tarneit VIC",
  "Point Cook VIC",
  "Werribee VIC",
  "Clayton VIC",
  "Dandenong VIC",
  "Cranbourne VIC",
  "Pakenham VIC",
  "Box Hill VIC",
  "Brunswick VIC",
  "Craigieburn VIC",
  "Geelong VIC",
  "Ballarat VIC",
  "Bendigo VIC",
  "Shepparton VIC",
  "Mildura VIC",

  // QLD
  "Brisbane QLD",
  "Logan QLD",
  "Sunnybank QLD",
  "Gold Coast QLD",
  "Sunshine Coast QLD",
  "Ipswich QLD",
  "Toowoomba QLD",
  "Townsville QLD",
  "Cairns QLD",
  "Rockhampton QLD",
  "Mackay QLD",
  "Bundaberg QLD",
  "Hervey Bay QLD",

  // WA
  "Perth WA",
  "Fremantle WA",
  "Joondalup WA",
  "Rockingham WA",
  "Mandurah WA",
  "Bunbury WA",
  "Kalgoorlie WA",
  "Geraldton WA",
  "Albany WA",

  // SA
  "Adelaide SA",
  "Salisbury SA",
  "Mawson Lakes SA",
  "Mount Gambier SA",
  "Whyalla SA",

  // ACT
  "Canberra ACT",

  // TAS
  "Hobart TAS",
  "Launceston TAS",
  "Devonport TAS",
  "Burnie TAS",

  // NT
  "Darwin NT",
  "Palmerston NT",
  "Alice Springs NT",
];
