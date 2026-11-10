// Data for the interactives. Each item carries the number of its source in the list at the foot of the page.

export const PLACES = [
  { short: 'Toledo', name: 'Toledo, Ohio', when: '1934', lat: 41.66, lon: -83.56, text: 'Born here on 25 March 1934. After her parents separated she lived here with her mother.', cite: [1, 2] },
  { short: 'Smith College', name: 'Northampton, Massachusetts', when: '1952–56', lat: 42.33, lon: -72.64, text: 'Studied government at Smith College and graduated in 1956.', cite: [1] },
  { short: 'London', name: 'London', when: '1957', lat: 51.51, lon: -0.13, text: 'Waiting here for her Indian visa, she found she was pregnant and had an illegal abortion. She was 22.', cite: [3] },
  { short: 'Bombay', name: 'Bombay (Mumbai)', when: '1957', lat: 19.07, lon: 72.88, text: 'Her plane landed here at the start of her fellowship in India.', cite: [3] },
  { short: 'Delhi', name: 'Delhi', when: '1957–58', lat: 28.65, lon: 77.23, text: 'Lived at Miranda House, a women’s college of Delhi University.', cite: [3] },
  { short: 'Calcutta', name: 'Calcutta (Kolkata)', when: '1957–58', lat: 22.56, lon: 88.36, text: 'Set out from here for Kerala in a third-class carriage kept for women: “a dormitory on wheels”.', cite: [3] },
  { short: 'Vienna', name: 'Vienna', when: '1959', lat: 48.21, lon: 16.37, text: 'The Independent Research Service, which she directed, sent young Americans to a Soviet-backed youth festival here. The CIA paid.', cite: [2, 1] },
  { short: 'New York', name: 'New York City', when: '1960–2026', lat: 40.71, lon: -74.01, text: 'Home for 66 years: the Playboy Club, New York magazine, Ms., and the house where she died.', cite: [2, 4] },
  { short: 'Vassar', name: 'Poughkeepsie, New York', when: '1970', lat: 41.7, lon: -73.92, text: 'Gave the first of her many commencement speeches, at Vassar College.', cite: [1] },
  { short: 'Washington', name: 'Washington DC', when: '1971 · 2013 · 2017', lat: 38.9, lon: -77.04, text: 'Helped found the National Women’s Political Caucus, received the Presidential Medal of Freedom, and spoke at the Women’s March.', cite: [14, 1, 20] },
  { short: 'Houston', name: 'Houston, Texas', when: '1977', lat: 29.76, lon: -95.36, text: 'The first National Women’s Conference, which she recounts in My Life on the Road.', cite: [5] },
  { short: 'Pyongyang', name: 'Pyongyang, North Korea', when: '2015', lat: 39.03, lon: 125.75, text: 'Joined a peace gathering with North Korean women, then crossed the demilitarised zone to the South. She was 81.', cite: [22] },
];

export const FLIPS = [
  ['Status', 'Clearly, menstruation would become an enviable, boast-worthy, masculine event.'],
  ['Bragging', 'Men would brag about how long and how much.'],
  ['Supplies', 'Sanitary supplies would be federally funded and free.'],
  ['Congress', 'To prevent monthly work loss among the powerful, Congress would fund a National Institute of Dysmenorrhea.'],
  ['Menopause', 'Menopause would be celebrated as a positive event, the symbol that men had accumulated enough years of cyclical wisdom to need no more.'],
  ['Logic', 'In short, we would discover, as we should already have guessed, that logic is in the eye of the logician.'],
];

export const QUIZ = [
  { line: 'A woman needs a man like a fish needs a bicycle.', hers: false, why: 'The Australian writer Irina Dunn coined it. As the Guardian put it in 2014: “Irina Dunn said it, and Gloria Steinem popularised it.”', cite: [30] },
  { line: 'If men could get pregnant, abortion would be a sacrament.', hers: false, why: 'She said it for decades and always gave it away. To the Observer in 2011: “I think the person who said: ‘Honey, if men could get pregnant, abortion would be a sacrament’ was right.”', cite: [4] },
  { line: 'We are linked, not ranked.', hers: true, why: 'Her phrase, used for years. It is in her own Guardian article after the 2016 election, and it was the superpower she wished for in 2017.', cite: [16, 9] },
  { line: 'This is what 40 looks like. We’ve been lying for so long, who would know?', hers: true, why: 'Her reply to a reporter who told her she did not look 40. The wording shifts a little from one telling to the next.', cite: [31] },
  { line: 'You might say I’m a hopeaholic.', hers: true, why: 'From her own article in the Guardian in 2005. She went on: “Terminal hopefulness is an occupational hazard.”', cite: [32] },
];

// Year each state ratified, and year five of them voted to take it back (National Archives list, by year).
export const ERA = {
  ratified: {AK: 1972, CA: 1972, CO: 1972, CT: 1973, DE: 1972, HI: 1972, ID: 1972, IL: 2018, IN: 1977, IA: 1972, KS: 1972, KY: 1972, ME: 1974, MD: 1972, MA: 1972, MI: 1972, MN: 1973, MT: 1974, NE: 1972, NV: 2017, NH: 1972, NJ: 1972, NM: 1973, NY: 1972, ND: 1975, OH: 1974, OR: 1973, PA: 1972, RI: 1972, SD: 1973, TN: 1972, TX: 1972, VT: 1973, VA: 2020, WA: 1973, WV: 1972, WI: 1972, WY: 1973},
  rescinded: {ID: 1977, KY: 1978, NE: 1973, SD: 1979, TN: 1974},
  steps: [
    { year: 1972, text: 'Hawaii is first. Twenty-one more states follow before the year is out.' },
    { year: 1973, text: 'Eight more ratify. Nebraska votes to take its ratification back.' },
    { year: 1974, text: 'Three more. Tennessee votes to rescind.' },
    { year: 1975, text: 'North Dakota, alone.' },
    { year: 1977, text: 'Indiana is the 35th. Idaho votes to rescind. No state will ratify again for 40 years.' },
    { year: 1982, text: 'The extended deadline passes, three states short.<a class="cite" href="#s37">37</a> By now Kentucky and South Dakota have also voted to pull out.' },
    { year: 2017, text: 'Nevada ratifies, 35 years after the deadline.' },
    { year: 2018, text: 'Illinois makes 37.' },
    { year: 2020, text: 'Virginia becomes the 38th state.<a class="cite" href="#s36">36</a> The amendment has still not been certified, because the deadline had passed.' },
  ],
};

// A tile for each state: [column, row].
export const TILE = {
  AK: [0, 0], ME: [11, 0], VT: [10, 1], NH: [11, 1],
  WA: [1, 2], ID: [2, 2], MT: [3, 2], ND: [4, 2], MN: [5, 2], IL: [6, 2], WI: [7, 2], MI: [8, 2], NY: [9, 2], RI: [10, 2], MA: [11, 2],
  OR: [1, 3], NV: [2, 3], WY: [3, 3], SD: [4, 3], IA: [5, 3], IN: [6, 3], OH: [7, 3], PA: [8, 3], NJ: [9, 3], CT: [10, 3],
  CA: [1, 4], UT: [2, 4], CO: [3, 4], NE: [4, 4], MO: [5, 4], KY: [6, 4], WV: [7, 4], VA: [8, 4], MD: [9, 4], DE: [10, 4],
  AZ: [2, 5], NM: [3, 5], KS: [4, 5], AR: [5, 5], TN: [6, 5], NC: [7, 5], SC: [8, 5],
  OK: [4, 6], LA: [5, 6], MS: [6, 6], AL: [7, 6], GA: [8, 6],
  HI: [0, 7], TX: [4, 7], FL: [9, 7],
};

// [Congress, first year, women in total, in the House, in the Senate]: voting members who served at any time in that Congress.
export const CONGRESS = [[65,1917,1,1,0],[66,1919,0,0,0],[67,1921,4,3,1],[68,1923,1,1,0],[69,1925,3,3,0],[70,1927,5,5,0],[71,1929,9,9,0],[72,1931,8,7,1],[73,1933,8,7,1],[74,1935,8,6,2],[75,1937,9,6,3],[76,1939,9,8,1],[77,1941,10,9,1],[78,1943,9,8,1],[79,1945,11,11,0],[80,1947,8,7,1],[81,1949,10,9,1],[82,1951,11,10,1],[83,1953,15,12,3],[84,1955,18,17,1],[85,1957,16,15,1],[86,1959,19,17,2],[87,1961,20,18,2],[88,1963,14,12,2],[89,1965,13,11,2],[90,1967,12,11,1],[91,1969,11,10,1],[92,1971,15,13,2],[93,1973,16,16,0],[94,1975,19,19,0],[95,1977,21,18,3],[96,1979,17,16,1],[97,1981,23,21,2],[98,1983,24,22,2],[99,1985,25,23,2],[100,1987,26,24,2],[101,1989,31,29,2],[102,1991,33,29,4],[103,1993,54,47,7],[104,1995,57,48,9],[105,1997,64,55,9],[106,1999,65,56,9],[107,2001,73,60,13],[108,2003,74,60,14],[109,2005,82,68,14],[110,2007,92,76,16],[111,2009,93,76,18],[112,2011,93,76,17],[113,2013,101,81,20],[114,2015,105,85,20],[115,2017,111,88,23],[116,2019,128,102,26],[117,2021,152,126,26],[118,2023,154,128,26],[119,2025,155,128,27]];
