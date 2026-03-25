export interface Coin {
  id: string;
  name: string;
  denomination: string;
  year: number;
  description: string;
  imageUrl: string;
}

export const UK_COINS: Coin[] = [
  // 50p Coins
  {
    id: '50p-kew',
    name: 'Kew Gardens',
    denomination: '50p',
    year: 2009,
    description: 'The rarest 50p in circulation, featuring the famous Chinese Pagoda. High value for collectors.',
    imageUrl: 'https://picsum.photos/seed/uk-coin-50p-kew/600/600'
  },
  {
    id: '50p-rabbit',
    name: 'Peter Rabbit',
    denomination: '50p',
    year: 2016,
    description: 'Celebrating the 150th anniversary of Beatrix Potter. Features a detailed rabbit engraving.',
    imageUrl: 'https://picsum.photos/seed/uk-coin-50p-rabbit/600/600'
  },
  {
    id: '50p-brexit',
    name: 'Withdrawal from EU',
    denomination: '50p',
    year: 2020,
    description: 'Marking the UK leaving the European Union. Features the inscription "Peace, prosperity and friendship with all nations".',
    imageUrl: 'https://picsum.photos/seed/uk-coin-50p-brexit/600/600'
  },
  {
    id: '50p-olympic-swimming',
    name: 'Olympic Swimming',
    denomination: '50p',
    year: 2011,
    description: 'Part of the 2012 Olympic series. The original design showed water over the swimmer\'s face.',
    imageUrl: 'https://picsum.photos/seed/uk-coin-50p-swim/600/600'
  },
  {
    id: '50p-1969',
    name: 'First 50p Coin',
    denomination: '50p',
    year: 1969,
    description: 'The world\'s first seven-sided coin, introduced for decimalisation. Features Britannia seated.',
    imageUrl: 'https://picsum.photos/seed/uk-coin-50p-1969/600/600'
  },
  // £1 Coins
  {
    id: '1-nations',
    name: 'Nations of the Crown',
    denomination: '£1',
    year: 2017,
    description: 'The new 12-sided pound coin featuring the four floral emblems: rose, thistle, leek, and shamrock.',
    imageUrl: 'https://picsum.photos/seed/uk-coin-1p-2017/600/600'
  },
  {
    id: '1-edinburgh',
    name: 'Edinburgh City',
    denomination: '£1',
    year: 2011,
    description: 'Part of the Capital Cities series, featuring the Edinburgh coat of arms on the reverse.',
    imageUrl: 'https://picsum.photos/seed/uk-coin-1p-edin/600/600'
  },
  // £2 Coins
  {
    id: '2-commonwealth',
    name: 'Commonwealth Games',
    denomination: '£2',
    year: 2002,
    description: 'Features a stylized figure holding a banner. Four versions exist for the different UK nations.',
    imageUrl: 'https://picsum.photos/seed/uk-coin-2p-common/600/600'
  },
  {
    id: '2-fire-london',
    name: 'Great Fire of London',
    denomination: '£2',
    year: 2016,
    description: 'Commemorating the 350th anniversary of the Great Fire of 1666. Shows the city in flames.',
    imageUrl: 'https://picsum.photos/seed/uk-coin-2p-fire/600/600'
  },
  {
    id: '2-shakespeare-tragedies',
    name: 'Shakespeare Tragedies',
    denomination: '£2',
    year: 2016,
    description: 'Features a skull and a rose, representing Shakespeare\'s tragedies. Part of a three-coin set.',
    imageUrl: 'https://picsum.photos/seed/uk-coin-2p-shake/600/600'
  },
  // One Penny (1p)
  {
    id: '1p-1861',
    name: 'Victoria Bun Penny',
    denomination: '1p',
    year: 1861,
    description: 'Features the "Bun Head" portrait of Queen Victoria. A classic Victorian bronze penny.',
    imageUrl: 'https://picsum.photos/seed/uk-penny-1861/600/600'
  },
  {
    id: '1p-1877',
    name: 'Victoria Bronze Penny',
    denomination: '1p',
    year: 1877,
    description: 'A classic Victorian bronze penny from the mid-reign. Features Britannia on the reverse.',
    imageUrl: 'https://picsum.photos/seed/uk-penny-1877/600/600'
  },
  {
    id: '1p-1884',
    name: 'Victoria Bronze Penny',
    denomination: '1p',
    year: 1884,
    description: 'Late Victorian bronze penny featuring the Bun Head portrait. Check for wear on the hair.',
    imageUrl: 'https://picsum.photos/seed/uk-penny-1884/600/600'
  },
  {
    id: '1p-1893',
    name: 'Victoria Old Head Penny',
    denomination: '1p',
    year: 1893,
    description: 'Features the final "Old Head" or "Veiled Head" portrait of Victoria. More mature portrait.',
    imageUrl: 'https://picsum.photos/seed/uk-penny-1893/600/600'
  },
  {
    id: '1p-1896',
    name: 'Victoria Old Head Penny',
    denomination: '1p',
    year: 1896,
    description: 'A late Victorian penny from the Diamond Jubilee era. Britannia is seated on the reverse.',
    imageUrl: 'https://picsum.photos/seed/uk-penny-1896/600/600'
  },
  {
    id: '1p-1897',
    name: 'Victoria Old Head Penny',
    denomination: '1p',
    year: 1897,
    description: 'Commonly found Victorian penny from the end of the century. Look for crisp details in the crown.',
    imageUrl: 'https://picsum.photos/seed/uk-penny-1897/600/600'
  },
  {
    id: '1p-1899',
    name: 'Victoria Old Head Penny',
    denomination: '1p',
    year: 1899,
    description: 'The final penny issued in the 19th century. A significant historical marker.',
    imageUrl: 'https://picsum.photos/seed/uk-penny-1899/600/600'
  },
  {
    id: '1p-1906',
    name: 'Edward VII Penny',
    denomination: '1p',
    year: 1906,
    description: 'Features the portrait of King Edward VII facing right. Britannia is on the reverse.',
    imageUrl: 'https://picsum.photos/seed/uk-penny-1906/600/600'
  },
  {
    id: '1p-1908',
    name: 'Edward VII Penny',
    denomination: '1p',
    year: 1908,
    description: 'A well-known circulation penny from the Edwardian era. Often found in good condition.',
    imageUrl: 'https://picsum.photos/seed/uk-penny-1908/600/600'
  },
  {
    id: '1p-1914',
    name: 'George V Penny',
    denomination: '1p',
    year: 1914,
    description: 'Issued at the start of the First World War. Features King George V facing left.',
    imageUrl: 'https://picsum.photos/seed/uk-penny-1914/600/600'
  },
  {
    id: '1p-1953',
    name: 'Coronation Penny',
    denomination: '1p',
    year: 1953,
    description: 'Issued in the year of Queen Elizabeth II\'s coronation. Features a young portrait.',
    imageUrl: 'https://picsum.photos/seed/uk-penny-1953/600/600'
  },
  {
    id: '1p-1962',
    name: 'Elizabeth II Penny',
    denomination: '1p',
    year: 1962,
    description: 'A common bronze penny from the early 1960s. Features the lighthouse and ship.',
    imageUrl: 'https://picsum.photos/seed/uk-penny-1962/600/600'
  },
  {
    id: '1p-1967',
    name: 'Last Pre-Decimal Penny',
    denomination: '1p',
    year: 1967,
    description: 'The final year of the large bronze penny before decimalisation. Very common.',
    imageUrl: 'https://picsum.photos/seed/uk-penny-1967/600/600'
  },
  // Half Penny (1/2p)
  {
    id: 'half-p-1953',
    name: 'Elizabeth II Half Penny',
    denomination: '1/2p',
    year: 1953,
    description: 'Features the Golden Hind, the ship of Sir Francis Drake, on the reverse.',
    imageUrl: 'https://picsum.photos/seed/uk-halfp-1953/600/600'
  },
  {
    id: 'half-p-1967',
    name: 'Last Pre-Decimal Half Penny',
    denomination: '1/2p',
    year: 1967,
    description: 'The final year of the pre-decimal half penny. Features the Golden Hind.',
    imageUrl: 'https://picsum.photos/seed/uk-halfp-1967/600/600'
  },
  // Half Crown
  {
    id: 'half-crown-1953',
    name: 'Coronation Half Crown',
    denomination: 'Half Crown',
    year: 1953,
    description: 'A large silver-colored coin worth two shillings and sixpence. Features the Royal Shield.',
    imageUrl: 'https://picsum.photos/seed/uk-halfcrown-1953/600/600'
  },
  {
    id: 'half-crown-1967',
    name: 'Last Half Crown',
    denomination: 'Half Crown',
    year: 1967,
    description: 'The final year of the Half Crown before it was demonetised in 1970.',
    imageUrl: 'https://picsum.photos/seed/uk-halfcrown-1967/600/600'
  },
  // 1 Shilling
  {
    id: 'shilling-1953',
    name: 'Elizabeth II Shilling',
    denomination: '1 Shilling',
    year: 1953,
    description: 'Worth 12 pence. Two versions exist: one with the English crest and one with the Scottish.',
    imageUrl: 'https://picsum.photos/seed/uk-shilling-1953/600/600'
  },
  {
    id: 'shilling-1966',
    name: '1966 Shilling',
    denomination: '1 Shilling',
    year: 1966,
    description: 'A common circulation coin from the mid-60s. Part of the pre-decimal system.',
    imageUrl: 'https://picsum.photos/seed/uk-shilling-1966/600/600'
  },
  // 3 Pence (Threepence)
  {
    id: '3p-1953',
    name: 'Brass Threepence',
    denomination: '3p',
    year: 1953,
    description: 'The iconic 12-sided brass coin featuring the Tudor thrift plant. Very distinctive shape.',
    imageUrl: 'https://picsum.photos/seed/uk-3p-1953/600/600'
  },
  {
    id: '3p-1967',
    name: 'Last Brass Threepence',
    denomination: '3p',
    year: 1967,
    description: 'The final year of the pre-decimal threepence. Features the Tudor thrift.',
    imageUrl: 'https://picsum.photos/seed/uk-3p-1967/600/600'
  }
];
