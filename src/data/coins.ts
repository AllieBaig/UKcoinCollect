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
    description: 'The rarest 50p in circulation, featuring the famous Chinese Pagoda.',
    imageUrl: 'https://picsum.photos/seed/kew-gardens/400/400'
  },
  {
    id: '50p-rabbit',
    name: 'Peter Rabbit',
    denomination: '50p',
    year: 2016,
    description: 'Celebrating the 150th anniversary of Beatrix Potter.',
    imageUrl: 'https://picsum.photos/seed/peter-rabbit/400/400'
  },
  {
    id: '50p-brexit',
    name: 'Withdrawal from EU',
    denomination: '50p',
    year: 2020,
    description: 'Marking the UK leaving the European Union.',
    imageUrl: 'https://picsum.photos/seed/brexit-coin/400/400'
  },
  {
    id: '50p-olympic-swimming',
    name: 'Olympic Swimming',
    denomination: '50p',
    year: 2011,
    description: 'Part of the 2012 Olympic series, showing a swimmer.',
    imageUrl: 'https://picsum.photos/seed/swimming-coin/400/400'
  },
  {
    id: '50p-1969',
    name: 'First 50p Coin',
    denomination: '50p',
    year: 1969,
    description: 'The world\'s first seven-sided coin, introduced for decimalisation.',
    imageUrl: 'https://picsum.photos/seed/50p-1969/400/400'
  },
  // £1 Coins
  {
    id: '1-nations',
    name: 'Nations of the Crown',
    denomination: '£1',
    year: 2017,
    description: 'The new 12-sided pound coin featuring the four floral emblems.',
    imageUrl: 'https://picsum.photos/seed/nations-crown/400/400'
  },
  {
    id: '1-edinburgh',
    name: 'Edinburgh City',
    denomination: '£1',
    year: 2011,
    description: 'Part of the Capital Cities series, featuring the Edinburgh coat of arms.',
    imageUrl: 'https://picsum.photos/seed/edinburgh-1/400/400'
  },
  // £2 Coins
  {
    id: '2-commonwealth',
    name: 'Commonwealth Games',
    denomination: '£2',
    year: 2002,
    description: 'Features a stylized figure holding a banner, representing the games.',
    imageUrl: 'https://picsum.photos/seed/commonwealth/400/400'
  },
  {
    id: '2-fire-london',
    name: 'Great Fire of London',
    denomination: '£2',
    year: 2016,
    description: 'Commemorating the 350th anniversary of the Great Fire of 1666.',
    imageUrl: 'https://picsum.photos/seed/fire-london/400/400'
  },
  {
    id: '2-shakespeare-tragedies',
    name: 'Shakespeare Tragedies',
    denomination: '£2',
    year: 2016,
    description: 'Features a skull and a rose, representing Shakespeare\'s tragedies.',
    imageUrl: 'https://picsum.photos/seed/shakespeare/400/400'
  },
  // One Penny (1p)
  {
    id: '1p-1861',
    name: 'Victoria Bun Penny',
    denomination: '1p',
    year: 1861,
    description: 'Features the "Bun Head" portrait of Queen Victoria.',
    imageUrl: 'https://picsum.photos/seed/1p-1861/400/400'
  },
  {
    id: '1p-1877',
    name: 'Victoria Bronze Penny',
    denomination: '1p',
    year: 1877,
    description: 'A classic Victorian bronze penny from the mid-reign.',
    imageUrl: 'https://picsum.photos/seed/1p-1877/400/400'
  },
  {
    id: '1p-1884',
    name: 'Victoria Bronze Penny',
    denomination: '1p',
    year: 1884,
    description: 'Late Victorian bronze penny featuring the Bun Head.',
    imageUrl: 'https://picsum.photos/seed/1p-1884/400/400'
  },
  {
    id: '1p-1893',
    name: 'Victoria Old Head Penny',
    denomination: '1p',
    year: 1893,
    description: 'Features the final "Old Head" or "Veiled Head" portrait of Victoria.',
    imageUrl: 'https://picsum.photos/seed/1p-1893/400/400'
  },
  {
    id: '1p-1896',
    name: 'Victoria Old Head Penny',
    denomination: '1p',
    year: 1896,
    description: 'A late Victorian penny from the Diamond Jubilee era.',
    imageUrl: 'https://picsum.photos/seed/1p-1896/400/400'
  },
  {
    id: '1p-1897',
    name: 'Victoria Old Head Penny',
    denomination: '1p',
    year: 1897,
    description: 'Commonly found Victorian penny from the end of the century.',
    imageUrl: 'https://picsum.photos/seed/1p-1897/400/400'
  },
  {
    id: '1p-1899',
    name: 'Victoria Old Head Penny',
    denomination: '1p',
    year: 1899,
    description: 'The final penny issued in the 19th century.',
    imageUrl: 'https://picsum.photos/seed/1p-1899/400/400'
  },
  {
    id: '1p-1906',
    name: 'Edward VII Penny',
    denomination: '1p',
    year: 1906,
    description: 'Features the portrait of King Edward VII.',
    imageUrl: 'https://picsum.photos/seed/1p-1906/400/400'
  },
  {
    id: '1p-1908',
    name: 'Edward VII Penny',
    denomination: '1p',
    year: 1908,
    description: 'A well-known circulation penny from the Edwardian era.',
    imageUrl: 'https://picsum.photos/seed/1p-1908/400/400'
  },
  {
    id: '1p-1914',
    name: 'George V Penny',
    denomination: '1p',
    year: 1914,
    description: 'Issued at the start of the First World War.',
    imageUrl: 'https://picsum.photos/seed/1p-1914/400/400'
  },
  {
    id: '1p-1953',
    name: 'Coronation Penny',
    denomination: '1p',
    year: 1953,
    description: 'Issued in the year of Queen Elizabeth II\'s coronation.',
    imageUrl: 'https://picsum.photos/seed/1p-1953/400/400'
  },
  {
    id: '1p-1962',
    name: 'Elizabeth II Penny',
    denomination: '1p',
    year: 1962,
    description: 'A common bronze penny from the early 1960s.',
    imageUrl: 'https://picsum.photos/seed/1p-1962/400/400'
  },
  {
    id: '1p-1967',
    name: 'Last Pre-Decimal Penny',
    denomination: '1p',
    year: 1967,
    description: 'The final year of the large bronze penny before decimalisation.',
    imageUrl: 'https://picsum.photos/seed/1p-1967/400/400'
  },
  // Half Penny (1/2p)
  {
    id: 'half-p-1953',
    name: 'Elizabeth II Half Penny',
    denomination: '1/2p',
    year: 1953,
    description: 'Features the Golden Hind, the ship of Sir Francis Drake.',
    imageUrl: 'https://picsum.photos/seed/half-p-1953/400/400'
  },
  {
    id: 'half-p-1967',
    name: 'Last Pre-Decimal Half Penny',
    denomination: '1/2p',
    year: 1967,
    description: 'The final year of the pre-decimal half penny.',
    imageUrl: 'https://picsum.photos/seed/half-p-1967/400/400'
  },
  // Half Crown
  {
    id: 'half-crown-1953',
    name: 'Coronation Half Crown',
    denomination: 'Half Crown',
    year: 1953,
    description: 'A large silver-colored coin worth two shillings and sixpence.',
    imageUrl: 'https://picsum.photos/seed/half-crown-1953/400/400'
  },
  {
    id: 'half-crown-1967',
    name: 'Last Half Crown',
    denomination: 'Half Crown',
    year: 1967,
    description: 'The final year of the Half Crown before it was demonetised in 1970.',
    imageUrl: 'https://picsum.photos/seed/half-crown-1967/400/400'
  },
  // 1 Shilling
  {
    id: 'shilling-1953',
    name: 'Elizabeth II Shilling',
    denomination: '1 Shilling',
    year: 1953,
    description: 'Worth 12 pence, featuring the English or Scottish crest.',
    imageUrl: 'https://picsum.photos/seed/shilling-1953/400/400'
  },
  {
    id: 'shilling-1966',
    name: '1966 Shilling',
    denomination: '1 Shilling',
    year: 1966,
    description: 'A common circulation coin from the mid-60s.',
    imageUrl: 'https://picsum.photos/seed/shilling-1966/400/400'
  },
  // 3 Pence (Threepence)
  {
    id: '3p-1953',
    name: 'Brass Threepence',
    denomination: '3p',
    year: 1953,
    description: 'The iconic 12-sided brass coin featuring the Tudor thrift plant.',
    imageUrl: 'https://picsum.photos/seed/3p-1953/400/400'
  },
  {
    id: '3p-1967',
    name: 'Last Brass Threepence',
    denomination: '3p',
    year: 1967,
    description: 'The final year of the pre-decimal threepence.',
    imageUrl: 'https://picsum.photos/seed/3p-1967/400/400'
  }
];
