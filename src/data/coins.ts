export interface Coin {
  id: string;
  name: string;
  denomination: string;
  year: number;
  description: string;
  imageUrl: string;
  rarity?: string;
  summary?: string;
  value?: number;
  clue?: string;
  country: string;
  type: 'Modern' | 'Old';
}

export const EUROPEAN_COINS: Coin[] = [
  // UK Coins (Modern)
  {
    id: '50p-kew',
    name: 'Kew Gardens',
    denomination: '50p',
    year: 2009,
    description: 'The rarest 50p in circulation, featuring the famous Chinese Pagoda. High value for collectors.',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Kew_Gardens_50p_coin.jpg/600px-Kew_Gardens_50p_coin.jpg',
    summary: 'The holy grail of 50p coins. Only 210,000 were minted, making it exceptionally rare.',
    value: 250.00,
    clue: "Look for the Chinese Pagoda in the Royal Botanic Gardens.",
    country: 'UK',
    type: 'Modern'
  },
  {
    id: '50p-rabbit',
    name: 'Peter Rabbit',
    denomination: '50p',
    year: 2016,
    description: 'Celebrating the 150th anniversary of Beatrix Potter. Features a detailed rabbit engraving.',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Peter_Rabbit_50p_coin.jpg/600px-Peter_Rabbit_50p_coin.jpg',
    summary: 'A beloved commemorative coin. It features the iconic Beatrix Potter character.',
    value: 5.00,
    clue: "A mischievous rabbit is hiding in the garden.",
    country: 'UK',
    type: 'Modern'
  },
  {
    id: '50p-brexit',
    name: 'Withdrawal from EU',
    denomination: '50p',
    year: 2020,
    description: 'Marking the UK leaving the European Union. Features the inscription "Peace, prosperity and friendship with all nations".',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Brexit_50p_coin.jpg/600px-Brexit_50p_coin.jpg',
    summary: 'Commemorates the UK\'s exit from the EU. It is a significant historical marker.',
    country: 'UK',
    type: 'Modern'
  },
  {
    id: '50p-olympic-swimming',
    name: 'Olympic Swimming',
    denomination: '50p',
    year: 2011,
    description: 'Part of the 2012 Olympic series. The original design showed water over the swimmer\'s face.',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Olympic_Swimming_50p_coin.jpg/600px-Olympic_Swimming_50p_coin.jpg',
    summary: 'A rare Olympic 50p. The first version with water over the face is highly sought after.',
    country: 'UK',
    type: 'Modern'
  },
  {
    id: '50p-1969',
    name: 'First 50p Coin',
    denomination: '50p',
    year: 1969,
    description: 'The world\'s first seven-sided coin, introduced for decimalisation. Features Britannia seated.',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/1969_50p_coin.jpg/600px-1969_50p_coin.jpg',
    summary: 'The original seven-sided 50p. It marked the beginning of a new era in British currency.',
    country: 'UK',
    type: 'Modern'
  },
  {
    id: '1-nations',
    name: 'Nations of the Crown',
    denomination: '£1',
    year: 2017,
    description: 'The new 12-sided pound coin featuring the four floral emblems: rose, thistle, leek, and shamrock.',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/New_1_pound_coin.jpg/600px-New_1_pound_coin.jpg',
    summary: 'The modern 12-sided pound coin. It is designed to be the most secure coin in the world.',
    country: 'UK',
    type: 'Modern'
  },
  {
    id: '1-edinburgh',
    name: 'Edinburgh City',
    denomination: '£1',
    year: 2011,
    description: 'Part of the Capital Cities series, featuring the Edinburgh coat of arms on the reverse.',
    imageUrl: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&q=80&w=600',
    summary: 'Part of the Capital Cities series. It features the historic Edinburgh coat of arms.',
    country: 'UK',
    type: 'Modern'
  },
  {
    id: '2-commonwealth',
    name: 'Commonwealth Games',
    denomination: '£2',
    year: 2002,
    description: 'Features a stylized figure holding a banner. Four versions exist for the different UK nations.',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Commonwealth_Games_2_pound_coin.jpg/600px-Commonwealth_Games_2_pound_coin.jpg',
    summary: 'Commemorates the 2002 Commonwealth Games. Four distinct versions represent the UK nations.',
    country: 'UK',
    type: 'Modern'
  },
  {
    id: '2-fire-london',
    name: 'Great Fire of London',
    denomination: '£2',
    year: 2016,
    description: 'Commemorating the 350th anniversary of the Great Fire of 1666. Shows the city in flames.',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Great_Fire_of_London_2_pound_coin.jpg/600px-Great_Fire_of_London_2_pound_coin.jpg',
    summary: 'Marking the 350th anniversary of the Fire of London. It depicts the city in flames.',
    country: 'UK',
    type: 'Modern'
  },
  {
    id: '2-shakespeare-tragedies',
    name: 'Shakespeare Tragedies',
    denomination: '£2',
    year: 2016,
    description: 'Features a skull and a rose, representing Shakespeare\'s tragedies. Part of a three-coin set.',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Shakespeare_Tragedies_2_pound_coin.jpg/600px-Shakespeare_Tragedies_2_pound_coin.jpg',
    country: 'UK',
    type: 'Modern'
  },

  // UK Coins (Old)
  {
    id: '1p-1861',
    name: 'Victoria Bun Penny',
    denomination: 'Penny',
    year: 1861,
    description: 'Features the "Bun Head" portrait of Queen Victoria. A classic Victorian bronze penny.',
    imageUrl: 'https://images.unsplash.com/photo-1589483232748-515c025575bc?auto=format&fit=crop&q=80&w=600',
    country: 'UK',
    type: 'Old'
  },
  {
    id: '1p-1877',
    name: 'Victoria Bronze Penny',
    denomination: 'Penny',
    year: 1877,
    description: 'A classic Victorian bronze penny from the mid-reign. Features Britannia on the reverse.',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Victoria_Penny_1877.jpg/600px-Victoria_Penny_1877.jpg',
    country: 'UK',
    type: 'Old'
  },
  {
    id: '1p-1967',
    name: 'Last Pre-Decimal Penny',
    denomination: 'Penny',
    year: 1967,
    description: 'The final year of the large bronze penny before decimalisation. Very common.',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/1967_penny_reverse.jpg/600px-1967_penny_reverse.jpg',
    country: 'UK',
    type: 'Old'
  },
  {
    id: 'half-p-1967',
    name: 'Last Pre-Decimal Half Penny',
    denomination: 'Half Penny',
    year: 1967,
    description: 'The final year of the pre-decimal half penny. Features the Golden Hind.',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/1967_half_penny_reverse.jpg/600px-1967_half_penny_reverse.jpg',
    country: 'UK',
    type: 'Old'
  },
  {
    id: 'shilling-1966',
    name: '1966 Shilling',
    denomination: 'Shilling',
    year: 1966,
    description: 'A common circulation coin from the mid-60s. Part of the pre-decimal system.',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/1966_Shilling.jpg/600px-1966_Shilling.jpg',
    country: 'UK',
    type: 'Old'
  },

  // Ireland (Old)
  {
    id: 'ie-farthing-1928',
    name: 'Irish Farthing',
    denomination: 'Farthing',
    year: 1928,
    description: 'Features a woodcock. Part of the first Irish coinage series.',
    imageUrl: 'https://picsum.photos/seed/ie-farthing/600/600',
    country: 'Ireland',
    type: 'Old'
  },
  {
    id: 'ie-halfpenny-1928',
    name: 'Irish Half Penny',
    denomination: 'Half Penny',
    year: 1928,
    description: 'Features a sow and piglets. Symbol of fertility and agriculture.',
    imageUrl: 'https://picsum.photos/seed/ie-halfp/600/600',
    country: 'Ireland',
    type: 'Old'
  },
  {
    id: 'ie-penny-1928',
    name: 'Irish Free State Penny',
    denomination: 'Penny',
    year: 1928,
    description: 'Features the iconic Irish harp and a hen with chicks. Part of the first Irish coinage.',
    imageUrl: 'https://picsum.photos/seed/ie-penny/600/600',
    country: 'Ireland',
    type: 'Old'
  },
  {
    id: 'ie-threepence-1928',
    name: 'Irish Threepence',
    denomination: 'Threepence',
    year: 1928,
    description: 'Features a hare. Known for its high silver content in early years.',
    imageUrl: 'https://picsum.photos/seed/ie-3p/600/600',
    country: 'Ireland',
    type: 'Old'
  },
  {
    id: 'ie-sixpence-1928',
    name: 'Irish Sixpence',
    denomination: 'Sixpence',
    year: 1928,
    description: 'Features an Irish wolfhound. A symbol of strength and loyalty.',
    imageUrl: 'https://picsum.photos/seed/ie-6p/600/600',
    country: 'Ireland',
    type: 'Old'
  },
  {
    id: 'ie-shilling-1928',
    name: 'Irish Shilling',
    denomination: 'Shilling',
    year: 1928,
    description: 'Features a bull. Represents the importance of cattle in the Irish economy.',
    imageUrl: 'https://picsum.photos/seed/ie-shilling/600/600',
    country: 'Ireland',
    type: 'Old'
  },
  {
    id: 'ie-florin-1939',
    name: 'Irish Florin',
    denomination: 'Florin',
    year: 1939,
    description: 'Features a salmon, representing the abundance of Irish rivers.',
    imageUrl: 'https://picsum.photos/seed/ie-florin/600/600',
    country: 'Ireland',
    type: 'Old'
  },
  {
    id: 'ie-half-crown-1928',
    name: 'Irish Half Crown',
    denomination: 'Half Crown',
    year: 1928,
    description: 'Features an Irish hunter horse. The largest coin in the series.',
    imageUrl: 'https://picsum.photos/seed/ie-halfcrown/600/600',
    country: 'Ireland',
    type: 'Old'
  },

  // France (Old)
  {
    id: 'fr-franc-1960',
    name: 'Semeuse Franc',
    denomination: 'Franc',
    year: 1960,
    description: 'The classic "Sower" design by Oscar Roty. A symbol of French republicanism.',
    imageUrl: 'https://picsum.photos/seed/fr-franc/600/600',
    country: 'France',
    type: 'Old'
  },
  {
    id: 'fr-5franc-1960',
    name: '5 Francs Semeuse',
    denomination: 'Franc',
    year: 1960,
    description: 'Large silver coin featuring the Sower. Highly collectible.',
    imageUrl: 'https://picsum.photos/seed/fr-5franc/600/600',
    country: 'France',
    type: 'Old'
  },
  {
    id: 'fr-10franc-1974',
    name: '10 Francs Mathieu',
    denomination: 'Franc',
    year: 1974,
    description: 'Features a modern map of France. A staple of 70s French currency.',
    imageUrl: 'https://picsum.photos/seed/fr-10franc/600/600',
    country: 'France',
    type: 'Old'
  },

  // Germany (Old)
  {
    id: 'de-mark-1950',
    name: 'Deutsche Mark',
    denomination: 'Deutsche Mark',
    year: 1950,
    description: 'The symbol of the German economic miracle. Features an oak seedling.',
    imageUrl: 'https://picsum.photos/seed/de-mark/600/600',
    country: 'Germany',
    type: 'Old'
  },
  {
    id: 'de-2mark-1951',
    name: '2 Deutsche Mark',
    denomination: 'Deutsche Mark',
    year: 1951,
    description: 'Features the federal eagle. A symbol of post-war German identity.',
    imageUrl: 'https://picsum.photos/seed/de-2mark/600/600',
    country: 'Germany',
    type: 'Old'
  },
  {
    id: 'de-5mark-1951',
    name: '5 Deutsche Mark',
    denomination: 'Deutsche Mark',
    year: 1951,
    description: 'Large silver coin, often called "Heiermann".',
    imageUrl: 'https://picsum.photos/seed/de-5mark/600/600',
    country: 'Germany',
    type: 'Old'
  },

  // Italy (Old)
  {
    id: 'it-lira-1951',
    name: '50 Lire Vulcan',
    denomination: 'Lira',
    year: 1951,
    description: 'Features Vulcan at the anvil. A classic post-war Italian coin.',
    imageUrl: 'https://picsum.photos/seed/it-lira/600/600',
    country: 'Italy',
    type: 'Old'
  },
  {
    id: 'it-100lira-1955',
    name: '100 Lire Minerva',
    denomination: 'Lira',
    year: 1955,
    description: 'Features the goddess Minerva. One of the most common Italian coins.',
    imageUrl: 'https://picsum.photos/seed/it-100lira/600/600',
    country: 'Italy',
    type: 'Old'
  },
  {
    id: 'it-500lira-1958',
    name: '500 Lire Caravelle',
    denomination: 'Lira',
    year: 1958,
    description: 'Silver coin featuring Columbus\'s ships. Very popular with collectors.',
    imageUrl: 'https://picsum.photos/seed/it-500lira/600/600',
    country: 'Italy',
    type: 'Old'
  },

  // Spain (Old)
  {
    id: 'es-peseta-1944',
    name: 'Una Peseta',
    denomination: 'Peseta',
    year: 1944,
    description: 'Features the Spanish coat of arms. A common coin during the Franco era.',
    imageUrl: 'https://picsum.photos/seed/es-peseta/600/600',
    country: 'Spain',
    type: 'Old'
  },
  {
    id: 'es-5peseta-1949',
    name: '5 Pesetas Franco',
    denomination: 'Peseta',
    year: 1949,
    description: 'Features the portrait of Francisco Franco. Known as a "Duro".',
    imageUrl: 'https://picsum.photos/seed/es-5peseta/600/600',
    country: 'Spain',
    type: 'Old'
  },
  {
    id: 'es-100peseta-1975',
    name: '100 Pesetas Juan Carlos',
    denomination: 'Peseta',
    year: 1975,
    description: 'Large coin marking the transition to democracy.',
    imageUrl: 'https://picsum.photos/seed/es-100peseta/600/600',
    country: 'Spain',
    type: 'Old'
  },

  // Netherlands (Old)
  {
    id: 'nl-guilder-1967',
    name: 'Juliana Guilder',
    denomination: 'Guilder',
    year: 1967,
    description: 'Features Queen Juliana. The silver guilder was a staple of Dutch trade.',
    imageUrl: 'https://picsum.photos/seed/nl-guilder/600/600',
    country: 'Netherlands',
    type: 'Old'
  },
  {
    id: 'nl-2.5guilder-1969',
    name: '2.5 Guilders Rijksdaalder',
    denomination: 'Guilder',
    year: 1969,
    description: 'Large silver-colored coin, a favorite in the Netherlands.',
    imageUrl: 'https://picsum.photos/seed/nl-2.5guilder/600/600',
    country: 'Netherlands',
    type: 'Old'
  },

  // Belgium (Old)
  {
    id: 'be-franc-1950',
    name: 'Belgian Franc',
    denomination: 'Franc',
    year: 1950,
    description: 'Features a miner, representing Belgium\'s industrial heritage.',
    imageUrl: 'https://picsum.photos/seed/be-franc/600/600',
    country: 'Belgium',
    type: 'Old'
  },
  {
    id: 'be-20franc-1980',
    name: '20 Francs Baudouin',
    denomination: 'Franc',
    year: 1980,
    description: 'Features King Baudouin. A common late-era franc.',
    imageUrl: 'https://picsum.photos/seed/be-20franc/600/600',
    country: 'Belgium',
    type: 'Old'
  },

  // Austria (Old)
  {
    id: 'at-schilling-1959',
    name: 'Austrian Schilling',
    denomination: 'Schilling',
    year: 1959,
    description: 'Features the three-towered city gate. A symbol of Austrian stability.',
    imageUrl: 'https://picsum.photos/seed/at-schilling/600/600',
    country: 'Austria',
    type: 'Old'
  },
  {
    id: 'at-10schilling-1957',
    name: '10 Schilling Silver',
    denomination: 'Schilling',
    year: 1957,
    description: 'Features a woman from the Wachau region.',
    imageUrl: 'https://picsum.photos/seed/at-10schilling/600/600',
    country: 'Austria',
    type: 'Old'
  },

  // Modern Euro Samples (Modern)
  {
    id: 'eu-1-fr',
    name: 'French 1 Euro',
    denomination: '€1',
    year: 2002,
    description: 'Features the tree of life. Designed by Joaquin Jimenez.',
    imageUrl: 'https://picsum.photos/seed/eu-fr/600/600',
    country: 'France',
    type: 'Modern'
  },
  {
    id: 'eu-2-de',
    name: 'German 2 Euro',
    denomination: '€2',
    year: 2002,
    description: 'Features the federal eagle. A symbol of German sovereignty.',
    imageUrl: 'https://picsum.photos/seed/eu-de/600/600',
    country: 'Germany',
    type: 'Modern'
  },
  {
    id: 'eu-1-ie',
    name: 'Irish 1 Euro',
    denomination: '€1',
    year: 2002,
    description: 'Features the Irish harp, designed by Jarlath Hayes.',
    imageUrl: 'https://picsum.photos/seed/eu-ie/600/600',
    country: 'Ireland',
    type: 'Modern'
  },
  {
    id: 'eu-2-it',
    name: 'Italian 2 Euro',
    denomination: '€2',
    year: 2002,
    description: 'Features the portrait of Dante Alighieri by Raphael.',
    imageUrl: 'https://picsum.photos/seed/eu-it/600/600',
    country: 'Italy',
    type: 'Modern'
  },
  {
    id: 'eu-1-es',
    name: 'Spanish 1 Euro',
    denomination: '€1',
    year: 2002,
    description: 'Features the portrait of King Juan Carlos I.',
    imageUrl: 'https://picsum.photos/seed/eu-es/600/600',
    country: 'Spain',
    type: 'Modern'
  },
  {
    id: 'eu-2-nl',
    name: 'Dutch 2 Euro',
    denomination: '€2',
    year: 2002,
    description: 'Features Queen Beatrix in profile.',
    imageUrl: 'https://picsum.photos/seed/eu-nl/600/600',
    country: 'Netherlands',
    type: 'Modern'
  },
  {
    id: 'eu-1-be',
    name: 'Belgian 1 Euro',
    denomination: '€1',
    year: 2002,
    description: 'Features King Albert II.',
    imageUrl: 'https://picsum.photos/seed/eu-be/600/600',
    country: 'Belgium',
    type: 'Modern'
  },
  {
    id: 'eu-2-at',
    name: 'Austrian 2 Euro',
    denomination: '€2',
    year: 2002,
    description: 'Features the pacifist Bertha von Suttner.',
    imageUrl: 'https://picsum.photos/seed/eu-at/600/600',
    country: 'Austria',
    type: 'Modern'
  }
];
