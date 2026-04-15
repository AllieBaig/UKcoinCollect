
export type AppVersion = '2.0' | '2.5' | '3.0';

export interface CollectionData {
  version: AppVersion;
  collectedIds: string[];
  customCoins: any[];
  requestedCoins: any[];
  userProfile: any;
  userCoinImages: Record<string, string>;
  purchasedCoins?: any[];
  lastOpenedIds?: string[];
  userCoinDenominations?: Record<string, string>;
  userCoinValues?: Record<string, number>;
  collectionHistory?: Record<string, string>;
}

export const SCHEMAS: Record<AppVersion, string[]> = {
  '2.0': [
    'version',
    'collectedIds',
    'customCoins',
    'requestedCoins',
    'userProfile',
    'userCoinImages'
  ],
  '2.5': [
    'version',
    'collectedIds',
    'customCoins',
    'requestedCoins',
    'userProfile',
    'userCoinImages',
    'purchasedCoins',
    'lastOpenedIds',
    'userCoinDenominations',
    'userCoinValues'
  ],
  '3.0': [
    'version',
    'collectedIds',
    'customCoins',
    'requestedCoins',
    'userProfile',
    'userCoinImages',
    'purchasedCoins',
    'lastOpenedIds',
    'userCoinDenominations',
    'userCoinValues',
    'collectionHistory'
  ]
};

const sanitizeProfile = (profile: any, version: AppVersion) => {
  if (!profile) return {};
  const p = { ...profile };
  
  if (version === '2.0') {
    // Remove v2.5+ fields from profile
    delete p.dnaScore;
    delete p.unlockedClues;
    delete p.tags;
    delete p.coinTags;
    delete p.goals;
    delete p.timelineProgress;
    delete p.eraConquestProgress;
    delete p.missions;
    delete p.timelineStreak;
    delete p.lastTimelineDate;
  }
  
  if (version === '2.5') {
    // v2.5 keeps most things but maybe not v3 specific ones if we had any
    // For now v2.5 and v3.0 profile are similar in this implementation
  }

  return p;
};

export const convertStep = (data: any, from: AppVersion, to: AppVersion): any => {
  const newData = { ...data };
  newData.version = to;

  if (from === '3.0' && to === '2.5') {
    // Downgrade 3.0 -> 2.5
    delete newData.collectionHistory;
    // Sanitize profile if needed
    newData.userProfile = sanitizeProfile(newData.userProfile, '2.5');
  } else if (from === '2.5' && to === '2.0') {
    // Downgrade 2.5 -> 2.0
    delete newData.purchasedCoins;
    delete newData.lastOpenedIds;
    delete newData.userCoinDenominations;
    delete newData.userCoinValues;
    newData.userProfile = sanitizeProfile(newData.userProfile, '2.0');
  } else if (from === '2.0' && to === '2.5') {
    // Upgrade 2.0 -> 2.5
    newData.purchasedCoins = newData.purchasedCoins || [];
    newData.lastOpenedIds = newData.lastOpenedIds || [];
    newData.userCoinDenominations = newData.userCoinDenominations || {};
    newData.userCoinValues = newData.userCoinValues || {};
  } else if (from === '2.5' && to === '3.0') {
    // Upgrade 2.5 -> 3.0
    newData.collectionHistory = newData.collectionHistory || {};
  }

  // Final filter based on schema
  const allowedFields = SCHEMAS[to];
  const filteredData: any = {};
  allowedFields.forEach(field => {
    if (newData[field] !== undefined) {
      filteredData[field] = newData[field];
    }
  });

  return filteredData;
};

export const migrateData = (data: any, targetVersion: AppVersion): any => {
  let currentData = { ...data };
  let currentVersion = (data.version || '2.0') as AppVersion;

  const versions: AppVersion[] = ['2.0', '2.5', '3.0'];
  const currentIndex = versions.indexOf(currentVersion);
  const targetIndex = versions.indexOf(targetVersion);

  if (currentIndex === -1) return currentData; // Unknown version

  if (currentIndex < targetIndex) {
    // Upgrade
    for (let i = currentIndex; i < targetIndex; i++) {
      currentData = convertStep(currentData, versions[i], versions[i + 1]);
    }
  } else if (currentIndex > targetIndex) {
    // Downgrade
    for (let i = currentIndex; i > targetIndex; i--) {
      currentData = convertStep(currentData, versions[i], versions[i - 1]);
    }
  }

  return currentData;
};
