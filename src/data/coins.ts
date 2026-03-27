export interface Coin {
  id: string;
  name: string;
  denomination: string;
  year: number;
  description: string;
  imageUrl: string;
  rarity?: string;
  summary?: string;
}

export const UK_COINS: Coin[] = [
  // 50p Coins
  {
    id: '50p-kew',
    name: 'Kew Gardens',
    denomination: '50p',
    year: 2009,
    description: 'The rarest 50p in circulation, featuring the famous Chinese Pagoda. High value for collectors.',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Kew_Gardens_50p_coin.jpg/600px-Kew_Gardens_50p_coin.jpg',
    summary: 'The holy grail of 50p coins. Only 210,000 were minted, making it exceptionally rare.'
  },
  {
    id: '50p-rabbit',
    name: 'Peter Rabbit',
    denomination: '50p',
    year: 2016,
    description: 'Celebrating the 150th anniversary of Beatrix Potter. Features a detailed rabbit engraving.',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Peter_Rabbit_50p_coin.jpg/600px-Peter_Rabbit_50p_coin.jpg',
    summary: 'A beloved commemorative coin. It features the iconic Beatrix Potter character.'
  },
  {
    id: '50p-brexit',
    name: 'Withdrawal from EU',
    denomination: '50p',
    year: 2020,
    description: 'Marking the UK leaving the European Union. Features the inscription "Peace, prosperity and friendship with all nations".',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Brexit_50p_coin.jpg/600px-Brexit_50p_coin.jpg',
    summary: 'Commemorates the UK\'s exit from the EU. It is a significant historical marker.'
  },
  {
    id: '50p-olympic-swimming',
    name: 'Olympic Swimming',
    denomination: '50p',
    year: 2011,
    description: 'Part of the 2012 Olympic series. The original design showed water over the swimmer\'s face.',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Olympic_Swimming_50p_coin.jpg/600px-Olympic_Swimming_50p_coin.jpg',
    summary: 'A rare Olympic 50p. The first version with water over the face is highly sought after.'
  },
  {
    id: '50p-1969',
    name: 'First 50p Coin',
    denomination: '50p',
    year: 1969,
    description: 'The world\'s first seven-sided coin, introduced for decimalisation. Features Britannia seated.',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/1969_50p_coin.jpg/600px-1969_50p_coin.jpg',
    summary: 'The original seven-sided 50p. It marked the beginning of a new era in British currency.'
  },
  // £1 Coins
  {
    id: '1-nations',
    name: 'Nations of the Crown',
    denomination: '£1',
    year: 2017,
    description: 'The new 12-sided pound coin featuring the four floral emblems: rose, thistle, leek, and shamrock.',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/New_1_pound_coin.jpg/600px-New_1_pound_coin.jpg',
    summary: 'The modern 12-sided pound coin. It is designed to be the most secure coin in the world.'
  },
  {
    id: '1-edinburgh',
    name: 'Edinburgh City',
    denomination: '£1',
    year: 2011,
    description: 'Part of the Capital Cities series, featuring the Edinburgh coat of arms on the reverse.',
    imageUrl: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&q=80&w=600',
    summary: 'Part of the Capital Cities series. It features the historic Edinburgh coat of arms.'
  },
  // £2 Coins
  {
    id: '2-commonwealth',
    name: 'Commonwealth Games',
    denomination: '£2',
    year: 2002,
    description: 'Features a stylized figure holding a banner. Four versions exist for the different UK nations.',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Commonwealth_Games_2_pound_coin.jpg/600px-Commonwealth_Games_2_pound_coin.jpg',
    summary: 'Commemorates the 2002 Commonwealth Games. Four distinct versions represent the UK nations.'
  },
  {
    id: '2-fire-london',
    name: 'Great Fire of London',
    denomination: '£2',
    year: 2016,
    description: 'Commemorating the 350th anniversary of the Great Fire of 1666. Shows the city in flames.',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Great_Fire_of_London_2_pound_coin.jpg/600px-Great_Fire_of_London_2_pound_coin.jpg',
    summary: 'Marking the 350th anniversary of the Fire of London. It depicts the city in flames.'
  },
  {
    id: '2-shakespeare-tragedies',
    name: 'Shakespeare Tragedies',
    denomination: '£2',
    year: 2016,
    description: 'Features a skull and a rose, representing Shakespeare\'s tragedies. Part of a three-coin set.',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Shakespeare_Tragedies_2_pound_coin.jpg/600px-Shakespeare_Tragedies_2_pound_coin.jpg'
  },
  // One Penny (1p)
  {
    id: '1p-1861',
    name: 'Victoria Bun Penny',
    denomination: '1p',
    year: 1861,
    description: 'Features the "Bun Head" portrait of Queen Victoria. A classic Victorian bronze penny.',
    imageUrl: 'https://images.unsplash.com/photo-1589483232748-515c025575bc?auto=format&fit=crop&q=80&w=600'
  },
  {
    id: '1p-1877',
    name: 'Victoria Bronze Penny',
    denomination: '1p',
    year: 1877,
    description: 'A classic Victorian bronze penny from the mid-reign. Features Britannia on the reverse.',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Victoria_Penny_1877.jpg/600px-Victoria_Penny_1877.jpg'
  },
  {
    id: '1p-1884',
    name: 'Victoria Bronze Penny',
    denomination: '1p',
    year: 1884,
    description: 'Late Victorian bronze penny featuring the Bun Head portrait. Check for wear on the hair.',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/1884_UK_Penny.jpg/600px-1884_UK_Penny.jpg'
  },
  {
    id: '1p-1893',
    name: 'Victoria Old Head Penny',
    denomination: '1p',
    year: 1893,
    description: 'Features the final "Old Head" or "Veiled Head" portrait of Victoria. More mature portrait.',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/1893_UK_Penny.jpg/600px-1893_UK_Penny.jpg'
  },
  {
    id: '1p-1896',
    name: 'Victoria Old Head Penny',
    denomination: '1p',
    year: 1896,
    description: 'A late Victorian penny from the Diamond Jubilee era. Britannia is seated on the reverse.',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/1896_UK_Penny.jpg/600px-1896_UK_Penny.jpg'
  },
  {
    id: '1p-1897',
    name: 'Victoria Old Head Penny',
    denomination: '1p',
    year: 1897,
    description: 'Commonly found Victorian penny from the end of the century. Look for crisp details in the crown.',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/1897_UK_Penny.jpg/600px-1897_UK_Penny.jpg'
  },
  {
    id: '1p-1899',
    name: 'Victoria Old Head Penny',
    denomination: '1p',
    year: 1899,
    description: 'The final penny issued in the 19th century. A significant historical marker.',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/1899_UK_Penny.jpg/600px-1899_UK_Penny.jpg'
  },
  {
    id: '1p-1906',
    name: 'Edward VII Penny',
    denomination: '1p',
    year: 1906,
    description: 'Features the portrait of King Edward VII facing right. Britannia is on the reverse.',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/1906_UK_Penny.jpg/600px-1906_UK_Penny.jpg'
  },
  {
    id: '1p-1908',
    name: 'Edward VII Penny',
    denomination: '1p',
    year: 1908,
    description: 'A well-known circulation penny from the Edwardian era. Often found in good condition.',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/1908_UK_Penny.jpg/600px-1908_UK_Penny.jpg'
  },
  {
    id: '1p-1914',
    name: 'George V Penny',
    denomination: '1p',
    year: 1914,
    description: 'Issued at the start of the First World War. Features King George V facing left.',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/1914_UK_Penny.jpg/600px-1914_UK_Penny.jpg'
  },
  {
    id: '1p-1953',
    name: 'Coronation Penny',
    denomination: '1p',
    year: 1953,
    description: 'Issued in the year of Queen Elizabeth II\'s coronation. Features a young portrait.',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/1953_UK_Penny.jpg/600px-1953_UK_Penny.jpg'
  },
  {
    id: '1p-1962',
    name: 'Elizabeth II Penny',
    denomination: '1p',
    year: 1962,
    description: 'A common bronze penny from the early 1960s. Features the lighthouse and ship.',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/1962_UK_Penny.jpg/600px-1962_UK_Penny.jpg'
  },
  {
    id: '1p-1967',
    name: 'Last Pre-Decimal Penny',
    denomination: '1p',
    year: 1967,
    description: 'The final year of the large bronze penny before decimalisation. Very common.',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/1967_penny_reverse.jpg/600px-1967_penny_reverse.jpg'
  },
  // Half Penny (1/2p)
  {
    id: 'half-p-1953',
    name: 'Elizabeth II Half Penny',
    denomination: '1/2p',
    year: 1953,
    description: 'Features the Golden Hind, the ship of Sir Francis Drake, on the reverse.',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/1967_half_penny_reverse.jpg/600px-1967_half_penny_reverse.jpg'
  },
  {
    id: 'half-p-1967',
    name: 'Last Pre-Decimal Half Penny',
    denomination: '1/2p',
    year: 1967,
    description: 'The final year of the pre-decimal half penny. Features the Golden Hind.',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/1967_half_penny_reverse.jpg/600px-1967_half_penny_reverse.jpg'
  },
  // Half Crown
  {
    id: 'half-crown-1953',
    name: 'Coronation Half Crown',
    denomination: 'Half Crown',
    year: 1953,
    description: 'A large silver-colored coin worth two shillings and sixpence. Features the Royal Shield.',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/1953_Half_Crown.jpg/600px-1953_Half_Crown.jpg'
  },
  {
    id: 'half-crown-1967',
    name: 'Last Half Crown',
    denomination: 'Half Crown',
    year: 1967,
    description: 'The final year of the Half Crown before it was demonetised in 1970.',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/1967_Half_Crown.jpg/600px-1967_Half_Crown.jpg'
  },
  // 1 Shilling
  {
    id: 'shilling-1953',
    name: 'Elizabeth II Shilling',
    denomination: '1 Shilling',
    year: 1953,
    description: 'Worth 12 pence. Two versions exist: one with the English crest and one with the Scottish.',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/1953_Shilling.jpg/600px-1953_Shilling.jpg'
  },
  {
    id: 'shilling-1966',
    name: '1966 Shilling',
    denomination: '1 Shilling',
    year: 1966,
    description: 'A common circulation coin from the mid-60s. Part of the pre-decimal system.',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/1966_Shilling.jpg/600px-1966_Shilling.jpg'
  },
  // 3 Pence (Threepence)
  {
    id: '3p-1953',
    name: 'Brass Threepence',
    denomination: '3p',
    year: 1953,
    description: 'The iconic 12-sided brass coin featuring the Tudor thrift plant. Very distinctive shape.',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/1953_threepence_reverse.jpg/600px-1953_threepence_reverse.jpg'
  },
  {
    id: '3p-1967',
    name: 'Last Brass Threepence',
    denomination: '3p',
    year: 1967,
    description: 'The final year of the pre-decimal threepence. Features the Tudor thrift.',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/1953_threepence_reverse.jpg/600px-1953_threepence_reverse.jpg'
  }
];
