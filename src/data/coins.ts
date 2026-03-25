export interface Coin {
  id: string;
  name: string;
  denomination: string;
  year: number;
  description: string;
  imageUrl: string;
}

export const UK_COINS: Coin[] = [
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
    id: '50p-brexit',
    name: 'Withdrawal from EU',
    denomination: '50p',
    year: 2020,
    description: 'Marking the UK leaving the European Union.',
    imageUrl: 'https://picsum.photos/seed/brexit-coin/400/400'
  },
  {
    id: '1-nations',
    name: 'Nations of the Crown',
    denomination: '£1',
    year: 2017,
    description: 'The new 12-sided pound coin featuring the four floral emblems.',
    imageUrl: 'https://picsum.photos/seed/nations-crown/400/400'
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
    id: '2-shakespeare-tragedies',
    name: 'Shakespeare Tragedies',
    denomination: '£2',
    year: 2016,
    description: 'Features a skull and a rose, representing Shakespeare\'s tragedies.',
    imageUrl: 'https://picsum.photos/seed/shakespeare/400/400'
  }
];
