import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Trophy, Search, Folder, ChevronRight, CheckCircle2, Circle, 
  ArrowLeft, Info, X, Plus, Send, Clipboard, Camera, Loader2, Sparkles,
  User, Settings, Award, Calendar, BarChart3, Share, WifiOff, RefreshCw, AlertTriangle, Globe, AlertCircle, TrendingUp, Trash2, Shield, Copy, Edit,
  Zap, Target, Dices, Layout, ImageOff, Clock, CheckCircle, ShoppingCart, Tag, Table, History
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UK_COINS, Coin } from './data/coins';
import { GoogleGenAI, Type } from "@google/genai";

interface RequestedCoin {
  id: string;
  denomination: string;
  year: number;
  timestamp: number;
}

interface Mission {
  id: string;
  title: string;
  description: string;
  reward: number;
  isCompleted: boolean;
  type: 'daily' | 'weekly';
  progress: number;
  target: number;
}

interface UserProfile {
  name: string;
  avatar: string;
  joinDate: string;
  rank: string;
  points: number;
  level: number;
  streak: number;
  lastLoginDate: string;
  lastSpinDate?: string;
  missions: Mission[];
  badges: string[];
  collectionStreak?: number;
  lastCollectionDate?: string;
  totalSpend?: number;
  recoveryCode?: string;
  settings: {
    showBottomMenu: boolean;
    isDarkMode: boolean;
    followSystemTheme?: boolean;
    isCompactUI?: boolean;
    isTextMode?: boolean;
    isBackgroundRemovalEnabled?: boolean;
    isPurchaseMode?: boolean;
    showCoinPrice?: boolean;
    sortBy?: 'recent-added' | 'recent-opened' | 'name';
  };
  safeModeBackup?: string;
}

interface PurchasedCoin {
  id: string;
  coinId: string;
  name: string;
  denomination: string;
  amountPaid: number;
  date: string;
  month: string;
}

const POINT_VALUES = {
  COLLECT_COIN: 100,
  UPLOAD_PHOTO: 250,
  DAILY_CHECKIN: 50,
  COMPLETE_FOLDER: 1000,
  STREAK_BONUS: 100,
  MISSION_REWARD: 200,
  LUCKY_SPIN_MIN: 10,
  LUCKY_SPIN_MAX: 500,
  RARITY_BONUS: {
    'Common': 0,
    'Uncommon': 150,
    'Rare': 400,
    'Ultra Rare': 900
  }
};

const MISSIONS: Omit<Mission, 'isCompleted' | 'progress'>[] = [
  { id: 'm1', title: 'Daily Scout', description: 'Scan or add 1 coin today', reward: 150, type: 'daily', target: 1 },
  { id: 'm2', title: 'Lucky Spin', description: 'Try your luck today', reward: 100, type: 'daily', target: 1 },
  { id: 'm3', title: 'Collector Week', description: 'Collect 5 coins this week', reward: 500, type: 'weekly', target: 5 },
  { id: 'm4', title: 'Rare Find', description: 'Add a Rare or Ultra Rare coin', reward: 300, type: 'weekly', target: 1 }
];

const BADGES = [
  { id: 'b1', name: 'First Find', description: 'Collect your first coin', icon: <Award size={16} /> },
  { id: 'b2', name: 'Small Hoard', description: 'Collect 10 coins', icon: <Trophy size={16} /> },
  { id: 'b3', name: 'Rare Seeker', description: 'Find a Rare coin', icon: <Sparkles size={16} /> },
  { id: 'b4', name: 'Streak Master', description: 'Reach a 7-day streak', icon: <Zap size={16} /> },
  { id: 'b5', name: 'Master Hunter', description: 'Reach Level 10', icon: <Target size={16} /> }
];

const LEVEL_NAMES = [
  "Beginner Hunter",
  "Coin Collector",
  "Expert Hunter",
  "Master Collector",
  "Grand Master",
  "Coin Legend"
];

const getLevelInfo = (points: number) => {
  const level = Math.floor(points / 2000) + 1;
  const name = LEVEL_NAMES[Math.min(level - 1, LEVEL_NAMES.length - 1)];
  const nextLevelPoints = level * 2000;
  const progress = ((points % 2000) / 2000) * 100;
  return { level, name, nextLevelPoints, progress };
};

// Error Boundary Component
interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  handleReset = () => {
    if (confirm("This will clear all your collection data. Are you sure?")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  handleExportData = () => {
    try {
      const data = {
        collected_coins: JSON.parse(localStorage.getItem('collected_coins') || '[]'),
        custom_coins: JSON.parse(localStorage.getItem('custom_coins') || '[]'),
        requested_coins: JSON.parse(localStorage.getItem('requested_coins') || '[]'),
        user_profile: JSON.parse(localStorage.getItem('user_profile') || '{}'),
        user_coin_images: JSON.parse(localStorage.getItem('user_coin_images') || '{}'),
        exportedAt: new Date().toISOString()
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `coin-collector-emergency-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
    } catch (e) {
      alert("Failed to export data: " + e);
    }
  };

  handleEnterSafeMode = () => {
    localStorage.setItem('force_safe_mode', 'true');
    window.location.reload();
  };

  handleRestoreSafeMode = () => {
    const backup = localStorage.getItem('safe_mode_backup');
    if (backup) {
      if (confirm("Restore from last working version? This will overwrite current data.")) {
        try {
          const data = JSON.parse(backup);
          // Map keys correctly
          if (data.collectedIds) localStorage.setItem('collected_coins', JSON.stringify(data.collectedIds));
          if (data.customCoins) localStorage.setItem('custom_coins', JSON.stringify(data.customCoins));
          if (data.requestedCoins) localStorage.setItem('requested_coins', JSON.stringify(data.requestedCoins));
          if (data.userProfile) localStorage.setItem('user_profile', JSON.stringify(data.userProfile));
          if (data.userCoinImages) localStorage.setItem('user_coin_images', JSON.stringify(data.userCoinImages));
          if (data.purchasedCoins) localStorage.setItem('purchased_coins', JSON.stringify(data.purchasedCoins));
          
          window.location.reload();
        } catch (e) {
          alert("Failed to restore backup: " + e);
        }
      }
    } else {
      alert("No safe mode backup found.");
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl max-w-sm w-full space-y-6 border-t-8 border-amber-500">
            <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto">
              <Shield size={40} />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">App Recovery</h1>
              <p className="text-gray-500 text-sm leading-relaxed">The application encountered a problem. Don't worry, your data is protected. Choose an option below to continue.</p>
            </div>
            
            <div className="space-y-3">
              <button 
                onClick={this.handleEnterSafeMode}
                className="w-full py-4 bg-amber-500 text-white font-black rounded-2xl hover:bg-amber-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-100 uppercase tracking-widest text-xs"
              >
                <Shield size={18} />
                Enter Safe Mode
              </button>

              <button 
                onClick={this.handleRestoreSafeMode}
                className="w-full py-4 bg-blue-500 text-white font-black rounded-2xl hover:bg-blue-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-100 uppercase tracking-widest text-xs"
              >
                <Clock size={18} />
                Restore Last Working
              </button>

              <button 
                onClick={this.handleExportData}
                className="w-full py-4 bg-green-500 text-white font-black rounded-2xl hover:bg-green-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-100 uppercase tracking-widest text-xs"
              >
                <Share size={18} />
                Export My Data
              </button>
              
              <button 
                onClick={() => window.location.reload()}
                className="w-full py-3 text-gray-400 font-bold hover:text-gray-600 transition-all text-xs uppercase tracking-widest"
              >
                Try Normal Reload
              </button>
            </div>

            {this.state.error && (
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-[10px] text-gray-400 font-mono break-all opacity-70">
                  Error: {this.state.error.message}
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <CoinCollectorApp />
    </ErrorBoundary>
  );
}

function CoinCollectorApp() {
  const [collectedIds, setCollectedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('collected_coins');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load collected_coins", e);
      return [];
    }
  });
  const [customCoins, setCustomCoins] = useState<Coin[]>(() => {
    try {
      const saved = localStorage.getItem('custom_coins');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load custom_coins", e);
      return [];
    }
  });
  const [requestedCoins, setRequestedCoins] = useState<RequestedCoin[]>(() => {
    try {
      const saved = localStorage.getItem('requested_coins');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load requested_coins", e);
      return [];
    }
  });
  const [purchasedCoins, setPurchasedCoins] = useState<PurchasedCoin[]>(() => {
    try {
      const saved = localStorage.getItem('purchased_coins');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load purchased_coins", e);
      return [];
    }
  });
  const [isSafeMode, setIsSafeMode] = useState(() => {
    return localStorage.getItem('force_safe_mode') === 'true';
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'collected' | 'missing'>('all');
  const [selectedCoin, setSelectedCoin] = useState<Coin | null>(null);
  const [activeDenomination, setActiveDenomination] = useState<string | null>(null);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  
  // Request Form State
  const [reqName, setReqName] = useState('');
  const [reqDenom, setReqDenom] = useState('50p');
  const [reqYear, setReqYear] = useState(new Date().getFullYear());
  const [reqPhoto, setReqPhoto] = useState<string | null>(null);
  const [isAddingToCollection, setIsAddingToCollection] = useState(false);

  const [isZoomed, setIsZoomed] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isWebSearchOpen, setIsWebSearchOpen] = useState(false);
  const [webSearchQuery, setWebSearchQuery] = useState('');
  const [webSearchResults, setWebSearchResults] = useState<string[]>([]);
  const [isSearchingWeb, setIsSearchingWeb] = useState(false);
  const [isManualAddOpen, setIsManualAddOpen] = useState(false);
  const [isPurchasedAddOpen, setIsPurchasedAddOpen] = useState(false);
  const [isPhotoLibraryOpen, setIsPhotoLibraryOpen] = useState(false);
  const [isSpinModalOpen, setIsSpinModalOpen] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionData, setConversionData] = useState<any>(null);
  const [conversionError, setConversionError] = useState<string | null>(null);

  const convertOldData = (oldData: any) => {
    try {
      const newData: any = {};
      
      // Map snake_case to camelCase
      if (oldData.collected_coins) newData.collectedIds = oldData.collected_coins;
      if (oldData.custom_coins) newData.customCoins = oldData.custom_coins;
      if (oldData.requested_coins) newData.requestedCoins = oldData.requested_coins;
      if (oldData.user_profile) newData.userProfile = oldData.user_profile;
      if (oldData.user_coin_images) newData.userCoinImages = oldData.user_coin_images;
      
      // Handle very old flat array format
      if (Array.isArray(oldData)) {
        newData.collectedIds = oldData;
      }

      // Ensure all required fields exist and map nested snake_case
      if (newData.userProfile) {
        const up = newData.userProfile;
        if (up.total_spend !== undefined && up.totalSpend === undefined) up.totalSpend = up.total_spend;
        if (up.join_date !== undefined && up.joinDate === undefined) up.joinDate = up.join_date;
        if (up.last_login_date !== undefined && up.lastLoginDate === undefined) up.lastLoginDate = up.last_login_date;
        if (up.collection_streak !== undefined && up.collectionStreak === undefined) up.collectionStreak = up.collection_streak;
        if (up.last_collection_date !== undefined && up.lastCollectionDate === undefined) up.lastCollectionDate = up.last_collection_date;
        
        if (up.settings) {
          const s = up.settings;
          if (s.is_dark_mode !== undefined && s.isDarkMode === undefined) s.isDarkMode = s.is_dark_mode;
          if (s.show_bottom_menu !== undefined && s.showBottomMenu === undefined) s.showBottomMenu = s.show_bottom_menu;
          if (s.follow_system_theme !== undefined && s.followSystemTheme === undefined) s.followSystemTheme = s.follow_system_theme;
          if (s.is_compact_ui !== undefined && s.isCompactUI === undefined) s.isCompactUI = s.is_compact_ui;
        }
      }

      // Preserve existing new fields if they were already there (hybrid case)
      if (oldData.collectedIds) newData.collectedIds = oldData.collectedIds;
      if (oldData.customCoins) newData.customCoins = oldData.customCoins;
      if (oldData.requestedCoins) newData.requestedCoins = oldData.requestedCoins;
      if (oldData.userProfile) newData.userProfile = oldData.userProfile;
      if (oldData.userCoinImages) newData.userCoinImages = oldData.userCoinImages;
      if (oldData.purchasedCoins) newData.purchasedCoins = oldData.purchasedCoins;

      return newData;
    } catch (err) {
      console.error("Conversion failed:", err);
      throw new Error("Data mapping failed. The file might be corrupted.");
    }
  };

  const isOldDataFormat = (data: any) => {
    if (Array.isArray(data)) return true;
    return !!(data.collected_coins || data.custom_coins || data.requested_coins || data.user_profile || data.user_coin_images);
  };

  const handleApplyConversion = (data: any) => {
    try {
      // Create backup before applying
      const backup = {
        collectedIds,
        customCoins,
        requestedCoins,
        userProfile,
        userCoinImages,
        purchasedCoins,
        backupDate: new Date().toISOString()
      };
      localStorage.setItem('coin_collection_backup', JSON.stringify(backup));

      const converted = convertOldData(data);
      
      if (converted.collectedIds) setCollectedIds(converted.collectedIds);
      if (converted.customCoins) setCustomCoins(converted.customCoins);
      if (converted.requestedCoins) setRequestedCoins(converted.requestedCoins);
      if (converted.userProfile) setUserProfile(converted.userProfile);
      if (converted.userCoinImages) setUserCoinImages(converted.userCoinImages);
      if (converted.purchasedCoins) setPurchasedCoins(converted.purchasedCoins);

      setIsConverting(false);
      setConversionData(null);
      alert("Conversion successful! Your data has been updated to the new format.");
    } catch (err) {
      setConversionError(err instanceof Error ? err.message : "Unknown error during conversion");
    }
  };

  const [importProgress, setImportProgress] = useState<number | null>(null);
  
  const [manualCoinName, setManualCoinName] = useState('');
  const [manualCoinDenom, setManualCoinDenom] = useState('50p');
  const [manualCoinYear, setManualCoinYear] = useState(new Date().getFullYear());
  const [manualCoinSummary, setManualCoinSummary] = useState('');
  const [manualCoinRarity, setManualCoinRarity] = useState('Common');
  const [manualCoinPhoto, setManualCoinPhoto] = useState<string | null>(null);
  const [manualCoinAmount, setManualCoinAmount] = useState<string>('');
  const [manualCoinValue, setManualCoinValue] = useState<string>('');
  const [isPurchased, setIsPurchased] = useState(false);
  const [editingCoinId, setEditingCoinId] = useState<string | null>(null);

  const [lastOpenedIds, setLastOpenedIds] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('last_opened_ids');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem('last_opened_ids', JSON.stringify(lastOpenedIds));
  }, [lastOpenedIds]);
  
  const [pointsNotification, setPointsNotification] = useState<{ amount: number; message: string } | null>(null);
  
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('user_profile');
      const defaultProfile: UserProfile = {
        name: 'Coin Collector',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
        joinDate: new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
        rank: 'Beginner Hunter',
        points: 0,
        level: 1,
        streak: 0,
        lastLoginDate: '',
        missions: MISSIONS.map(m => ({ ...m, isCompleted: false, progress: 0 })),
        badges: [],
        collectionStreak: 0,
        lastCollectionDate: '',
        settings: {
          showBottomMenu: true,
          isDarkMode: false,
          isTextMode: false,
          isBackgroundRemovalEnabled: true,
          isPurchaseMode: false,
          showCoinPrice: true
        }
      };

      if (!saved) return defaultProfile;
      
      const parsed = JSON.parse(saved);
      // Merge with defaults to ensure new fields exist
      return {
        ...defaultProfile,
        ...parsed,
        settings: {
          ...defaultProfile.settings,
          ...parsed.settings
        },
        missions: parsed.missions || defaultProfile.missions
      };
    } catch (e) {
      console.error("Failed to load user_profile", e);
      return {
        name: 'Coin Collector',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
        joinDate: new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
        rank: 'Beginner Hunter',
        points: 0,
        level: 1,
        streak: 0,
        lastLoginDate: '',
        missions: MISSIONS.map(m => ({ ...m, isCompleted: false, progress: 0 })),
        badges: [],
        collectionStreak: 0,
        lastCollectionDate: '',
        settings: {
          showBottomMenu: true,
          isDarkMode: false,
          isTextMode: false,
          isBackgroundRemovalEnabled: true,
          isPurchaseMode: false,
          showCoinPrice: true
        }
      };
    }
  });

  useEffect(() => {
    // Handle Daily Streak and Missions Reset
    const today = new Date().toISOString().split('T')[0];
    const lastLogin = userProfile.lastLoginDate;

    if (lastLogin !== today) {
      setUserProfile(prev => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        let newStreak = prev.streak;
        if (lastLogin === yesterdayStr) {
          newStreak += 1;
        } else if (lastLogin !== '') {
          newStreak = 1;
        } else {
          newStreak = 1;
        }

        // Reset daily missions
        const updatedMissions = prev.missions.map(m => 
          m.type === 'daily' ? { ...m, isCompleted: false } : m
        );

        // Check for weekly reset (every Monday)
        const isMonday = new Date().getDay() === 1;
        const finalMissions = isMonday 
          ? updatedMissions.map(m => m.type === 'weekly' ? { ...m, isCompleted: false } : m)
          : updatedMissions;

        return {
          ...prev,
          lastLoginDate: today,
          streak: newStreak,
          missions: finalMissions
        };
      });

      if (lastLogin !== '') {
        addPoints(POINT_VALUES.DAILY_CHECKIN, `Daily Login! Day ${userProfile.streak + 1}`);
      }
    }
  }, []);

  useEffect(() => {
    // Check for Badges
    const checkBadges = () => {
      const newBadges = [...userProfile.badges];
      let changed = false;

      if (collectedIds.length >= 1 && !newBadges.includes('b1')) {
        newBadges.push('b1');
        changed = true;
        addPoints(500, "Badge Unlocked: First Find!");
      }
      if (collectedIds.length >= 10 && !newBadges.includes('b2')) {
        newBadges.push('b2');
        changed = true;
        addPoints(1000, "Badge Unlocked: Small Hoard!");
      }
      const hasRare = allCoins.some(c => collectedIds.includes(c.id) && (c.rarity === 'Rare' || c.rarity === 'Ultra Rare'));
      if (hasRare && !newBadges.includes('b3')) {
        newBadges.push('b3');
        changed = true;
        addPoints(1500, "Badge Unlocked: Rare Seeker!");
      }
      if (userProfile.streak >= 7 && !newBadges.includes('b4')) {
        newBadges.push('b4');
        changed = true;
        addPoints(2000, "Badge Unlocked: Streak Master!");
      }
      if (userProfile.level >= 10 && !newBadges.includes('b5')) {
        newBadges.push('b5');
        changed = true;
        addPoints(5000, "Badge Unlocked: Master Hunter!");
      }

      if (changed) {
        setUserProfile(prev => ({ ...prev, badges: newBadges }));
      }
    };

    checkBadges();
  }, [collectedIds.length, userProfile.level, userProfile.streak]);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check if running in standalone mode (PWA)
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                 (window.navigator as any).standalone || 
                 document.referrer.includes('android-app://');
    setIsStandalone(isPWA);

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleThemeChange = () => {
      if (userProfile.settings?.followSystemTheme) {
        applyTheme();
      }
    };
    mediaQuery.addEventListener('change', handleThemeChange);

    // Periodically save a "Safe Mode" backup
    const saveBackup = () => {
      try {
        const data = {
          collected_coins: localStorage.getItem('collected_coins'),
          custom_coins: localStorage.getItem('custom_coins'),
          requested_coins: localStorage.getItem('requested_coins'),
          user_profile: localStorage.getItem('user_profile'),
          user_coin_images: localStorage.getItem('user_coin_images'),
          purchased_coins: localStorage.getItem('purchased_coins'),
        };
        localStorage.setItem('safe_mode_backup', JSON.stringify(data));
      } catch (e) {
        console.error("Failed to save safe mode backup", e);
      }
    };

    const timer = setTimeout(saveBackup, 10000); // Save after 10s of working

    // Show install prompt for iOS users not in standalone mode
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    if (isIOS && !isPWA) {
      const lastPrompt = localStorage.getItem('last_install_prompt');
      const now = Date.now();
      // Show prompt every 3 days if not installed
      if (!lastPrompt || now - parseInt(lastPrompt) > 3 * 24 * 60 * 60 * 1000) {
        setShowInstallPrompt(true);
      }
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      mediaQuery.removeEventListener('change', handleThemeChange);
    };
  }, []);

  // Apply Dark Mode when settings change
  const applyTheme = () => {
    const isDark = userProfile.settings?.followSystemTheme 
      ? window.matchMedia('(prefers-color-scheme: dark)').matches 
      : userProfile.settings?.isDarkMode;
    
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  useEffect(() => {
    applyTheme();
  }, [userProfile.settings?.isDarkMode, userProfile.settings?.followSystemTheme]);

  // Streak Logic
  useEffect(() => {
    const today = new Date().toDateString();
    if (userProfile.lastLoginDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toDateString();

      let newStreak = 1;
      let bonusPoints = 0;
      let message = "Welcome back!";

      if (userProfile.lastLoginDate === yesterdayStr) {
        newStreak = userProfile.streak + 1;
        bonusPoints = POINT_VALUES.STREAK_BONUS;
        message = `Day ${newStreak} Streak!`;
      }

      const newBadges = [...userProfile.badges];
      if (newStreak === 3 && !newBadges.includes('3-Day Streak')) newBadges.push('3-Day Streak');
      if (newStreak === 7 && !newBadges.includes('7-Day Streak')) newBadges.push('7-Day Streak');
      if (newStreak === 30 && !newBadges.includes('30-Day Streak')) newBadges.push('30-Day Streak');

      setUserProfile(prev => ({
        ...prev,
        streak: newStreak,
        lastLoginDate: today,
        points: prev.points + bonusPoints,
        badges: newBadges
      }));

      if (bonusPoints > 0) {
        setPointsNotification({ amount: bonusPoints, message });
        setTimeout(() => setPointsNotification(null), 3000);
      }
    }
  }, []);

  const [userCoinImages, setUserCoinImages] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('user_coin_images');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      console.error("Failed to load user_coin_images", e);
      return {};
    }
  });

  // Automatic Backup Logic
  useEffect(() => {
    // 1. Stability Check: If app runs for 5 seconds without crashing, save as "last working"
    const stabilityTimer = setTimeout(() => {
      const state = {
        collectedIds,
        customCoins,
        requestedCoins,
        userProfile,
        userCoinImages,
        purchasedCoins,
        timestamp: Date.now()
      };
      localStorage.setItem('safe_mode_backup', JSON.stringify(state));
    }, 5000);

    // 2. Daily Backup: Save a separate backup once per day
    const lastDailyBackup = localStorage.getItem('last_daily_backup_date');
    const today = new Date().toISOString().split('T')[0];
    
    if (lastDailyBackup !== today) {
      const state = {
        collectedIds,
        customCoins,
        requestedCoins,
        userProfile,
        userCoinImages,
        purchasedCoins,
        timestamp: Date.now()
      };
      localStorage.setItem(`daily_backup_${today}`, JSON.stringify(state));
      localStorage.setItem('last_daily_backup_date', today);
    }

    return () => clearTimeout(stabilityTimer);
  }, [collectedIds, customCoins, requestedCoins, userProfile, userCoinImages, purchasedCoins]);

  const [scanResult, setScanResult] = useState<{ denomination: string; year: number | null; photo?: string } | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const FALLBACK_COIN_IMAGE = 'https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&q=80&w=600';

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = FALLBACK_COIN_IMAGE;
  };

  const compressImage = (file: File, maxWidth = 600): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          // Use a lower quality to reduce size
          resolve(canvas.toDataURL('image/jpeg', 0.5));
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  const completeMission = (missionId: string, amount: number = 1) => {
    setUserProfile(prev => {
      const updatedMissions = prev.missions.map(m => {
        if (m.id === missionId && !m.isCompleted) {
          const newProgress = (m.progress || 0) + amount;
          const isNowCompleted = newProgress >= (m.target || 1);
          if (isNowCompleted) {
            addPoints(m.reward, `Mission Complete: ${m.title}!`);
          }
          return { ...m, progress: newProgress, isCompleted: isNowCompleted };
        }
        return m;
      });
      return { ...prev, missions: updatedMissions };
    });
  };

  const addPoints = (amount: number, message?: string) => {
    setUserProfile(prev => {
      const newPoints = prev.points + amount;
      const { level, name } = getLevelInfo(newPoints);
      return { ...prev, points: newPoints, level, rank: name };
    });
    if (message) {
      setPointsNotification({ amount, message });
      setTimeout(() => setPointsNotification(null), 3000);
    }
  };

  useEffect(() => {
    localStorage.setItem('collected_coins', JSON.stringify(collectedIds));
  }, [collectedIds]);

  useEffect(() => {
    localStorage.setItem('custom_coins', JSON.stringify(customCoins));
  }, [customCoins]);

  useEffect(() => {
    localStorage.setItem('requested_coins', JSON.stringify(requestedCoins));
  }, [requestedCoins]);

  useEffect(() => {
    localStorage.setItem('user_profile', JSON.stringify(userProfile));
  }, [userProfile]);

  useEffect(() => {
    localStorage.setItem('user_coin_images', JSON.stringify(userCoinImages));
  }, [userCoinImages]);

  const allCoins = useMemo(() => {
    const baseCoins = [...UK_COINS, ...customCoins];
    return baseCoins.map(coin => ({
      ...coin,
      imageUrl: userCoinImages[coin.id] || coin.imageUrl
    }));
  }, [customCoins, userCoinImages]);

  const progress = Math.round((collectedIds.length / allCoins.length) * 100);

  useEffect(() => {
    let newRank = 'Novice Hunter';
    if (progress >= 90) newRank = 'Legend of the Mint';
    else if (progress >= 60) newRank = 'Master Numismatist';
    else if (progress >= 30) newRank = 'Expert Collector';
    else if (progress >= 10) newRank = 'Coin Enthusiast';

    if (newRank !== userProfile.rank) {
      setUserProfile(prev => ({ ...prev, rank: newRank }));
    }
  }, [progress, userProfile.rank]);

  const toggleCollected = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const coin = allCoins.find(c => c.id === id);
    
    setCollectedIds(prev => {
      const isCollecting = !prev.includes(id);
      if (isCollecting) {
        addPoints(POINT_VALUES.COLLECT_COIN, "Coin Collected!");
        completeMission('m1');
        completeMission('m3');
        if (coin && ['Rare', 'Epic', 'Legendary', 'Ultra Rare'].includes(coin.rarity || '')) {
          completeMission('m4');
        }
        
        // Collection Streak Logic
        const today = new Date().toDateString();
        setUserProfile(up => {
          let newCollStreak = up.collectionStreak || 0;
          if (up.lastCollectionDate !== today) {
            newCollStreak += 1;
            const newBadges = [...up.badges];
            if (newCollStreak === 5 && !newBadges.includes('5-Day Collector')) newBadges.push('5-Day Collector');
            return { ...up, collectionStreak: newCollStreak, lastCollectionDate: today, badges: newBadges };
          }
          return up;
        });

        // Navigate to folder if not already in one
        if (!activeDenomination && coin) {
          setActiveDenomination(coin.denomination);
        }

        // Folder Completion Check
        if (coin) {
          const coinsInDenom = UK_COINS.filter(c => c.denomination === coin.denomination);
          const collectedInDenom = coinsInDenom.filter(c => [...prev, id].includes(c.id)).length;
          if (collectedInDenom === coinsInDenom.length) {
            addPoints(POINT_VALUES.COMPLETE_FOLDER, `${coin.denomination} Folder Complete!`);
            setUserProfile(up => {
              const newBadges = [...up.badges];
              const badgeName = `${coin.denomination} Master`;
              if (!newBadges.includes(badgeName)) newBadges.push(badgeName);
              return { ...up, badges: newBadges };
            });
          }
        }
      }
      return isCollecting ? [...prev, id] : prev.filter(i => i !== id);
    });
  };

  const denominations = useMemo(() => {
    const unique = Array.from(new Set(allCoins.map(c => c.denomination))) as string[];
    const order = ['£2', '£1', 'Half Crown', '1 Shilling', '50p', '3p', '1p', '1/2p'];
    const sorted = unique.sort((a, b) => {
      const indexA = order.indexOf(a);
      const indexB = order.indexOf(b);
      if (indexA === -1 && indexB === -1) return a.localeCompare(b);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
    return [...sorted, 'Purchased'];
  }, [allCoins]);

  const monthlyTotal = useMemo(() => {
    const now = new Date();
    const currentMonth = now.toLocaleString('default', { month: 'long', year: 'numeric' });
    return purchasedCoins
      .filter(p => p.month === currentMonth)
      .reduce((sum, p) => sum + p.amountPaid, 0);
  }, [purchasedCoins]);

  const filteredCoins = useMemo(() => {
    return allCoins.filter(coin => {
      const matchesSearch = coin.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           coin.denomination.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filter === 'all' || 
                           (filter === 'collected' && collectedIds.includes(coin.id)) ||
                           (filter === 'missing' && !collectedIds.includes(coin.id));
      
      let matchesDenom = true;
      if (activeDenomination) {
        if (activeDenomination === 'Purchased') {
          const purchasedIds = purchasedCoins.map(p => p.coinId);
          matchesDenom = purchasedIds.includes(coin.id);
        } else {
          matchesDenom = coin.denomination === activeDenomination;
        }
      }
      
      return matchesSearch && matchesFilter && matchesDenom;
    }).sort((a, b) => {
      const sortBy = userProfile.settings?.sortBy || 'recent-added';
      
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'recent-opened') {
        return (lastOpenedIds[b.id] || 0) - (lastOpenedIds[a.id] || 0);
      } else {
        // Default: Recently Added
        const aIsCustom = a.id.startsWith('custom-');
        const bIsCustom = b.id.startsWith('custom-');
        if (aIsCustom && !bIsCustom) return -1;
        if (!aIsCustom && bIsCustom) return 1;
        if (aIsCustom && bIsCustom) return b.id.localeCompare(a.id);
        
        const aCollected = collectedIds.includes(a.id);
        const bCollected = collectedIds.includes(b.id);
        if (aCollected !== bCollected) return aCollected ? -1 : 1;
        return a.name.localeCompare(b.name);
      }
    });
  }, [searchQuery, filter, collectedIds, activeDenomination, allCoins, purchasedCoins, userProfile.settings?.sortBy, lastOpenedIds]);

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isAddingToCollection) {
      const newCoin: Coin = {
        id: `custom-${Date.now()}`,
        name: reqName || `${reqDenom} (${reqYear})`,
        denomination: reqDenom,
        year: reqYear,
        description: 'Custom added coin.',
        imageUrl: reqPhoto || FALLBACK_COIN_IMAGE
      };
      setCustomCoins(prev => [...prev, newCoin]);
      setCollectedIds(prev => [...prev, newCoin.id]);
      addPoints(POINT_VALUES.COLLECT_COIN, "New Coin Added!");
      if (reqPhoto) addPoints(POINT_VALUES.UPLOAD_PHOTO, "Photo Uploaded!");
      setIsRequestModalOpen(false);
      // Reset
      setReqName('');
      setReqPhoto(null);
      setIsAddingToCollection(false);
      return;
    }

    const newRequest: RequestedCoin = {
      id: `req-${Date.now()}`,
      denomination: reqDenom,
      year: reqYear,
      timestamp: Date.now()
    };
    setRequestedCoins(prev => [newRequest, ...prev]);
    setIsRequestModalOpen(false);
    // Reset form
    setReqYear(new Date().getFullYear());
  };

  const copyRequestsToClipboard = () => {
    const text = requestedCoins
      .map(r => `${r.denomination} (${r.year})`)
      .join('\n');
    navigator.clipboard.writeText(`My Coin Requests:\n${text}`);
    alert('Requests copied! You can now paste them in the chat.');
  };

  const exportCollection = () => {
    const data = {
      collectedIds,
      customCoins,
      requestedCoins,
      userProfile,
      userCoinImages,
      purchasedCoins,
      lastOpenedIds,
      version: '2.0'
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-').slice(0, 5);
    a.href = url;
    a.download = `coin-collector-backup-${dateStr}-${timeStr}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const generateRecoveryCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 12; i++) {
      if (i > 0 && i % 4 === 0) code += '-';
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setUserProfile(prev => ({ ...prev, recoveryCode: code }));
    return code;
  };

  const importCollection = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      
      setImportProgress(0);
      
      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setImportProgress(progress);
        }
      };

      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          
          if (isOldDataFormat(data)) {
            setConversionData(data);
            setIsConverting(true);
            setImportProgress(null);
            return;
          }

          // Simulate a bit of progress for UX if it's too fast
          let p = 0;
          const interval = setInterval(() => {
            p += 10;
            setImportProgress(p);
            if (p >= 100) {
              clearInterval(interval);
              if (data.collectedIds) setCollectedIds(data.collectedIds);
              if (data.customCoins) setCustomCoins(data.customCoins);
              if (data.requestedCoins) setRequestedCoins(data.requestedCoins);
              if (data.userProfile) setUserProfile(data.userProfile);
              if (data.userCoinImages) setUserCoinImages(data.userCoinImages);
              if (data.purchasedCoins) setPurchasedCoins(data.purchasedCoins);
              setImportProgress(null);
              alert("Collection imported successfully!");
            }
          }, 50);
        } catch (err) {
          setImportProgress(null);
          alert("Failed to import collection. Invalid file format.");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const startScanner = async () => {
    setIsScanning(true);
    setScanResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access camera. Please check permissions.");
      setIsScanning(false);
    }
  };

  const stopScanner = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setIsScanning(false);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    try {
      const compressedBase64 = await compressImage(file);
      const base64Image = compressedBase64.split(',')[1];
      const fullPhoto = compressedBase64;

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            parts: [
              { text: "Identify this UK coin. Return the denomination (e.g., '50p', '£1', '1p', 'Half Crown', '1 Shilling', '3p', '1/2p', '£2'), the year (e.g., 1967), and a short descriptive name for the design (e.g., 'Kew Gardens', 'Britannia', 'Peter Rabbit'). If you are unsure, return 'unknown' for any field." },
              { inlineData: { mimeType: "image/jpeg", data: base64Image } }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              denomination: { type: Type.STRING },
              year: { type: Type.INTEGER, nullable: true },
              name: { type: Type.STRING, nullable: true }
            },
            required: ["denomination"]
          }
        }
      });

      const result = JSON.parse(response.text);
      
      // Find or Create
      const foundCoin = allCoins.find(c => 
        c.denomination.toLowerCase() === result.denomination.toLowerCase() && 
        c.year === result.year &&
        (result.name && result.name !== 'unknown' ? c.name.toLowerCase().includes(result.name.toLowerCase()) : true)
      );

      if (foundCoin) {
        setCollectedIds(prev => {
          const isCollecting = !prev.includes(foundCoin.id);
          if (isCollecting) {
            const rarityBonus = POINT_VALUES.RARITY_BONUS[foundCoin.rarity as keyof typeof POINT_VALUES.RARITY_BONUS] || 0;
            addPoints(POINT_VALUES.COLLECT_COIN + rarityBonus, `Coin Added! ${foundCoin.rarity !== 'Common' ? `(${foundCoin.rarity} Bonus)` : ''}`);
            completeMission('m1');
            completeMission('m3');
            if (['Rare', 'Epic', 'Legendary', 'Ultra Rare'].includes(foundCoin.rarity || '')) {
              completeMission('m4');
            }
          }
          return isCollecting ? [...prev, foundCoin.id] : prev;
        });
        addPoints(POINT_VALUES.UPLOAD_PHOTO, "Photo Saved!");
        setUserCoinImages(prev => ({ ...prev, [foundCoin.id]: fullPhoto }));
        setSelectedCoin({ ...foundCoin, imageUrl: fullPhoto });
      } else {
        const newCoin: Coin = {
          id: `custom-${Date.now()}`,
          name: result.name && result.name !== 'unknown' ? result.name : `${result.denomination} (${result.year || 'Unknown Year'})`,
          denomination: result.denomination !== 'unknown' ? result.denomination : 'Custom',
          year: result.year || new Date().getFullYear(),
          description: 'Automatically identified via photo.',
          imageUrl: fullPhoto,
          rarity: 'Common'
        };
        setCustomCoins(prev => [...prev, newCoin]);
        setCollectedIds(prev => [...prev, newCoin.id]);
        addPoints(POINT_VALUES.COLLECT_COIN, "New Coin Found!");
        addPoints(POINT_VALUES.UPLOAD_PHOTO, "Photo Saved!");
        setSelectedCoin(newCoin);
      }
    } catch (err) {
      console.error("AI Analysis failed:", err);
      alert("Could not identify coin from photo. Please try again.");
    } finally {
      setIsAnalyzing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const captureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setIsAnalyzing(true);
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    // Capture at a smaller size for analysis and storage
    const targetWidth = 400;
    const targetHeight = (video.videoHeight / video.videoWidth) * targetWidth;
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
      // Use lower quality for storage
      const fullPhoto = canvas.toDataURL('image/jpeg', 0.5);
      const base64Image = fullPhoto.split(',')[1];
      
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: [
            {
              parts: [
                { text: "Identify this UK coin. Return the denomination (e.g., '50p', '£1', '1p', 'Half Crown', '1 Shilling', '3p', '1/2p', '£2') and the year (e.g., 1967). If you are unsure, return 'unknown' for either field." },
                { inlineData: { mimeType: "image/jpeg", data: base64Image } }
              ]
            }
          ],
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                denomination: { type: Type.STRING },
                year: { type: Type.INTEGER, nullable: true }
              },
              required: ["denomination"]
            }
          }
        });

        const result = JSON.parse(response.text);
        setScanResult({ ...result, photo: fullPhoto });
        
        // Check if coin exists in collection
        const foundCoin = allCoins.find(c => 
          c.denomination.toLowerCase() === result.denomination.toLowerCase() && 
          c.year === result.year
        );

        if (foundCoin) {
          setCollectedIds(prev => {
            const isCollecting = !prev.includes(foundCoin.id);
            if (isCollecting) {
              addPoints(POINT_VALUES.COLLECT_COIN, "Coin Identified!");
              completeMission('m1');
              completeMission('m3');
              if (['Rare', 'Epic', 'Legendary', 'Ultra Rare'].includes(foundCoin.rarity || '')) {
                completeMission('m4');
              }
            }
            return isCollecting ? [...prev, foundCoin.id] : prev;
          });
          addPoints(POINT_VALUES.UPLOAD_PHOTO, "Photo Saved!");
          setUserCoinImages(prev => ({ ...prev, [foundCoin.id]: fullPhoto }));
          setSelectedCoin({ ...foundCoin, imageUrl: fullPhoto });
          stopScanner();
        } else {
          // Pre-fill request form
          setReqDenom(result.denomination !== 'unknown' ? result.denomination : '50p');
          setReqYear(result.year || new Date().getFullYear());
          setReqPhoto(fullPhoto);
        }
      } catch (err) {
        console.error("AI Analysis failed:", err);
        alert("Could not identify coin. Please try again or add manually.");
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  const changeCoinImage = async (coinId: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      setIsAnalyzing(true);
      try {
        const compressedBase64 = await compressImage(file);
        setUserCoinImages(prev => ({ ...prev, [coinId]: compressedBase64 }));
        addPoints(POINT_VALUES.UPLOAD_PHOTO, "Photo Updated!");
        completeMission('m3');
        if (selectedCoin && selectedCoin.id === coinId) {
          setSelectedCoin({ ...selectedCoin, imageUrl: compressedBase64 });
        }
      } catch (err) {
        console.error("Failed to change image:", err);
      } finally {
        setIsAnalyzing(false);
      }
    };
    input.click();
  };

  const searchWebImages = async (query: string) => {
    if (!query.trim()) return;
    setIsSearchingWeb(true);
    setWebSearchResults([]);
    
    // Include denomination and year if available to refine search
    const fullQuery = selectedCoin 
      ? `${selectedCoin.denomination} ${selectedCoin.year} ${query}` 
      : query;

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Find 8 direct, high-quality image URLs for the UK coin: "${fullQuery}". 
        Return ONLY a JSON array of strings containing the direct image URLs. 
        Do not include any other text. 
        Focus on clear, professional numismatic photos.`,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      });

      const urls = JSON.parse(response.text);
      if (Array.isArray(urls)) {
        setWebSearchResults(urls.filter(url => url.startsWith('http')));
      }
    } catch (error) {
      console.error("Web search failed:", error);
      // Fallback to some placeholder images if search fails
      setWebSearchResults([
        `https://picsum.photos/seed/${query}1/400/400`,
        `https://picsum.photos/seed/${query}2/400/400`,
        `https://picsum.photos/seed/${query}3/400/400`,
        `https://picsum.photos/seed/${query}4/400/400`,
      ]);
    } finally {
      setIsSearchingWeb(false);
    }
  };

  const selectWebImage = (url: string) => {
    if (selectedCoin) {
      setUserCoinImages(prev => ({ ...prev, [selectedCoin.id]: url }));
      setSelectedCoin(prev => prev ? { ...prev, imageUrl: url } : null);
      addPoints(POINT_VALUES.UPLOAD_PHOTO, "Web Image Added!");
    }
    setIsWebSearchOpen(false);
  };

  const logPurchase = (coin: Coin, amount: number) => {
    const now = new Date();
    const month = now.toLocaleString('default', { month: 'long', year: 'numeric' });
    const purchase: PurchasedCoin = {
      id: `purchase-${Date.now()}`,
      coinId: coin.id,
      name: coin.name,
      denomination: coin.denomination,
      amountPaid: amount,
      date: now.toISOString(),
      month: month
    };
    setPurchasedCoins(prev => [...prev, purchase]);
    setUserProfile(prev => ({
      ...prev,
      totalSpend: (prev.totalSpend || 0) + amount
    }));
    
    const rarityBonus = POINT_VALUES.RARITY_BONUS[coin.rarity as keyof typeof POINT_VALUES.RARITY_BONUS] || 0;
    addPoints(POINT_VALUES.COLLECT_COIN + rarityBonus, `Purchase Logged! ${coin.rarity !== 'Common' ? `(${coin.rarity} Bonus)` : ''}`);
  };

  const handleSelectCoin = (coin: Coin) => {
    setSelectedCoin(coin);
    // Update last opened
    setLastOpenedIds(prev => ({ ...prev, [coin.id]: Date.now() }));
  };

  const addManualCoin = async () => {
    if (!manualCoinName.trim()) return;
    
    const newId = editingCoinId || `custom-${Date.now()}`;
    const newCoin: Coin = {
      id: newId,
      name: manualCoinName,
      denomination: manualCoinDenom,
      year: manualCoinYear,
      description: manualCoinSummary || `User-added: ${manualCoinName} (${manualCoinDenom})`,
      imageUrl: manualCoinPhoto || FALLBACK_COIN_IMAGE,
      rarity: manualCoinRarity,
      value: manualCoinValue ? parseFloat(manualCoinValue) : undefined
    };

    if (editingCoinId) {
      setCustomCoins(prev => prev.map(c => c.id === editingCoinId ? newCoin : c));
      if (manualCoinPhoto) {
        setUserCoinImages(prev => ({ ...prev, [editingCoinId]: manualCoinPhoto }));
      }
      addPoints(POINT_VALUES.COLLECT_COIN, "Coin Updated!");
    } else {
      setCustomCoins(prev => [...prev, newCoin]);
      setCollectedIds(prev => [...prev, newCoin.id]);
      if (manualCoinPhoto) {
        setUserCoinImages(prev => ({ ...prev, [newCoin.id]: manualCoinPhoto }));
      }
      
      if (isPurchased && manualCoinAmount) {
        const amount = parseFloat(manualCoinAmount);
        if (!isNaN(amount)) {
          logPurchase(newCoin, amount);
        }
      } else {
        addPoints(POINT_VALUES.COLLECT_COIN, "Manual Coin Added!");
      }
      completeMission('m1');
      completeMission('m3');
      if (['Rare', 'Epic', 'Legendary', 'Ultra Rare'].includes(newCoin.rarity || '')) {
        completeMission('m4');
      }
    }
    
    // Reset form
    setManualCoinName('');
    setManualCoinSummary('');
    setManualCoinRarity('Common');
    setManualCoinPhoto(null);
    setManualCoinAmount('');
    setManualCoinValue('');
    setIsPurchased(false);
    setIsManualAddOpen(false);
    setEditingCoinId(null);
  };

  const editCoin = (coin: Coin) => {
    setEditingCoinId(coin.id);
    setManualCoinName(coin.name);
    setManualCoinDenom(coin.denomination);
    setManualCoinYear(coin.year);
    setManualCoinSummary(coin.description || '');
    setManualCoinRarity(coin.rarity || 'Common');
    setManualCoinValue(coin.value ? coin.value.toString() : '');
    setManualCoinPhoto(userCoinImages[coin.id] || coin.imageUrl || null);
    setIsManualAddOpen(true);
  };

  const handleManualPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsAnalyzing(true);
    try {
      const compressed = await compressImage(file);
      setManualCoinPhoto(compressed);
    } catch (err) {
      console.error("Failed to compress manual photo:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const refreshApp = () => {
    window.location.reload();
  };

  const exportData = () => {
    const data = {
      collectedIds,
      customCoins,
      requestedCoins,
      userProfile,
      userCoinImages,
      purchasedCoins,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `coin-collector-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    a.click();
  };

  const clearCache = () => {
    if ('caches' in window) {
      caches.keys().then(names => {
        for (let name of names) caches.delete(name);
      });
    }
    alert("Cache cleared successfully!");
  };

  const { level: currentLevel, name: levelName, nextLevelPoints, progress: levelProgress } = getLevelInfo(userProfile.points);

  if (isSafeMode) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Safe Mode Header */}
        <header className="bg-amber-500 text-white p-4 flex items-center justify-between shadow-lg sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <Shield size={24} />
            <div>
              <h1 className="text-xl font-black uppercase tracking-widest">Safe Mode</h1>
              <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest">Minimal Core Features Only</p>
            </div>
          </div>
          <button 
            onClick={() => {
              localStorage.removeItem('force_safe_mode');
              window.location.reload();
            }}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-xs font-black uppercase tracking-widest transition-colors"
          >
            Exit Safe Mode
          </button>
        </header>

        <main className="flex-1 p-6 max-w-2xl mx-auto w-full space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border-2 border-amber-100">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Welcome to Safe Mode</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              Safe Mode is active because the app encountered a problem. You can still view your collection and export your data safely.
            </p>
          </div>

          <div className="space-y-4">
             <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Core Actions</h3>
             <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={exportData}
                  className="p-4 bg-green-500 text-white rounded-2xl flex flex-col items-center gap-2 shadow-lg shadow-green-100"
                >
                  <Share size={24} />
                  <span className="text-xs font-bold uppercase tracking-widest">Export Data</span>
                </button>
                <button 
                  onClick={() => {
                    localStorage.removeItem('force_safe_mode');
                    window.location.reload();
                  }}
                  className="p-4 bg-amber-500 text-white rounded-2xl flex flex-col items-center gap-2 shadow-lg shadow-amber-100"
                >
                  <RefreshCw size={24} />
                  <span className="text-xs font-bold uppercase tracking-widest">Try Normal Mode</span>
                </button>
             </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Your Collection</h3>
            <div className="space-y-2">
              {allCoins.filter(c => collectedIds.includes(c.id)).length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
                  <Folder size={40} className="mx-auto text-gray-200 mb-2" />
                  <p className="text-gray-400 text-sm">No coins collected yet.</p>
                </div>
              ) : (
                allCoins.filter(c => collectedIds.includes(c.id)).map(coin => (
                  <div key={coin.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-gray-900">{coin.name}</p>
                      <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">{coin.denomination} • {coin.year}</p>
                    </div>
                    <CheckCircle2 className="text-amber-500" size={20} />
                  </div>
                ))
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-950 dark:text-white flex flex-col transition-colors duration-300 ${userProfile.settings?.isCompactUI ? 'text-sm' : 'text-base'}`} style={{ paddingTop: 'var(--safe-top)', paddingBottom: 'var(--safe-bottom)' }}>
      {/* Offline Indicator */}
      <AnimatePresence>
        {isOffline && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-red-500 text-white text-center py-1 text-xs font-bold flex items-center justify-center gap-2 z-[110]"
          >
            <WifiOff size={12} />
            You are currently offline. Some features may be limited.
          </motion.div>
        )}
      </AnimatePresence>

      {/* iOS Install Prompt */}
      <AnimatePresence>
        {showInstallPrompt && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowInstallPrompt(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-3 sm:space-y-4"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600">
                    <Trophy size={20} className="sm:w-6 sm:h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base sm:text-lg">Install Coin Collector</h3>
                    <p className="text-xs sm:text-sm text-gray-500">Add to your home screen for the best experience.</p>
                  </div>
                </div>
                <button onClick={() => {
                  setShowInstallPrompt(false);
                  localStorage.setItem('last_install_prompt', Date.now().toString());
                }} className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full">
                  <X size={18} className="sm:w-5 sm:h-5" />
                </button>
              </div>
              
              <div className="bg-gray-50 rounded-2xl p-3 sm:p-4 space-y-2 sm:space-y-3">
                <p className="text-xs sm:text-sm text-gray-700 flex items-center gap-2">
                  1. Tap the <span className="p-1 bg-white rounded border border-gray-200 inline-flex"><Share size={12} className="text-blue-500 sm:w-3.5 sm:h-3.5" /></span> button in the browser bar.
                </p>
                <p className="text-xs sm:text-sm text-gray-700">
                  2. Scroll down and tap <span className="font-bold">"Add to Home Screen"</span>.
                </p>
              </div>

              <button 
                onClick={() => {
                  setShowInstallPrompt(false);
                  localStorage.setItem('last_install_prompt', Date.now().toString());
                }}
                className="w-full py-3.5 sm:py-4 bg-gray-900 text-white font-bold rounded-2xl text-sm sm:text-base"
              >
                Got it
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Points Notification */}
      <AnimatePresence>
        {pointsNotification && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.8 }}
            animate={{ opacity: 1, y: 20, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.8 }}
            className="fixed top-2 sm:top-4 left-1/2 -translate-x-1/2 z-[100] bg-amber-500 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-full shadow-2xl flex items-center gap-2 sm:gap-3 border-2 border-white/20 backdrop-blur-md"
          >
            <div className="bg-white/20 p-1 rounded-full">
              <Award size={16} className="sm:w-5 sm:h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-tighter opacity-80 leading-tight">{pointsNotification.message}</span>
              <span className="text-sm sm:text-lg font-black leading-none">+{pointsNotification.amount} Points</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 px-3 py-3 sm:px-6 sm:py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            {(activeDenomination || activeDenomination === 'Wishlist') && (
              <button 
                onClick={() => {
                  setActiveDenomination(null);
                  setIsZoomed(false);
                }}
                className="p-1.5 -ml-1 sm:p-2 sm:-ml-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Back to folders"
              >
                <ArrowLeft size={20} className="sm:w-6 sm:h-6" />
              </button>
            )}
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-1.5 sm:gap-2">
              <Trophy className="text-amber-500 w-6 h-6 sm:w-7 sm:h-7" />
              <span className="truncate max-w-[120px] sm:max-w-none">
                {activeDenomination ? activeDenomination : 'Coin Collector'}
              </span>
            </h1>
          </div>
          <div className="flex gap-1.5 sm:gap-2 items-center">
            <div className="hidden sm:flex flex-col items-end mr-2">
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Level {userProfile.level}</span>
              <span className="text-sm font-bold text-gray-900">{userProfile.points.toLocaleString()} pts</span>
            </div>
            <button 
              onClick={() => setIsProfileOpen(true)}
              className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="View Profile"
            >
              <User size={20} className="text-gray-700 sm:w-6 sm:h-6" />
            </button>
            <button 
              onClick={() => {
                if (isOffline) {
                  alert("Scanning requires an internet connection for AI analysis. Please try again when online.");
                  return;
                }
                fileInputRef.current?.click();
              }}
              className={`bg-amber-500 text-white p-1.5 sm:p-2 rounded-full shadow-lg hover:bg-amber-600 transition-colors flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 ${isOffline ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
              title="Take a photo of a coin"
            >
              <Camera size={20} className="sm:w-6 sm:h-6" />
              <span className="hidden sm:inline font-bold">Take Photo</span>
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              capture="environment"
              onChange={handleFileSelect}
            />
            <button 
              onClick={() => {
                setIsAddingToCollection(false);
                setIsRequestModalOpen(true);
              }}
              className="bg-gray-900 text-white p-1.5 sm:p-2 rounded-full shadow-lg hover:bg-black transition-colors"
              title="Manual Request"
            >
              <Plus size={20} className="sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="max-w-2xl mx-auto mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-amber-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </header>

      {/* Search and Filters */}
      <div className="p-3 sm:p-4 bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto space-y-3 sm:space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text"
              placeholder="Search all coins..."
              className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-gray-100 border-none rounded-xl text-base sm:text-lg focus:ring-2 focus:ring-amber-500 outline-none transition-all"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value !== '') setActiveDenomination(null);
              }}
            />
          </div>
          
          <div className="flex items-center justify-between gap-2 mb-4 sm:mb-6">
            <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1 no-scrollbar flex-1">
              {(['all', 'collected', 'missing'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-[11px] sm:text-sm font-bold uppercase tracking-wide whitespace-nowrap transition-colors ${
                    filter === f 
                      ? 'bg-gray-900 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            
            <select
              value={userProfile.settings.sortBy || 'recent-added'}
              onChange={(e) => setUserProfile(prev => ({
                ...prev,
                settings: { ...prev.settings, sortBy: e.target.value as any }
              }))}
              className="bg-gray-100 text-gray-600 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-[11px] sm:text-sm font-bold uppercase tracking-wide border-none focus:ring-2 focus:ring-amber-500 transition-all"
            >
              <option value="name">Name</option>
              <option value="recent-added">Recent Added</option>
              <option value="recent-opened">Recent Opened</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 overflow-y-auto">
        <div className="max-w-2xl mx-auto grid gap-4">
          {userProfile.settings?.isPurchaseMode && (
            <div className="flex items-center justify-between p-4 bg-black dark:bg-white text-white dark:text-black rounded-3xl shadow-xl mb-2 animate-pulse">
              <div className="flex items-center gap-3">
                <ShoppingCart size={24} />
                <div>
                  <h4 className="text-lg font-black uppercase tracking-widest">Purchase Mode Active</h4>
                  <p className="text-[10px] opacity-70 font-bold uppercase tracking-wider">High-contrast table view enabled</p>
                </div>
              </div>
              <button 
                onClick={() => setUserProfile(prev => ({
                  ...prev,
                  settings: { ...prev.settings, isPurchaseMode: false }
                }))}
                className="px-4 py-2 bg-white/20 dark:bg-black/20 hover:bg-white/30 dark:hover:bg-black/30 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors"
              >
                Exit
              </button>
            </div>
          )}
          <AnimatePresence mode="popLayout">
            {!activeDenomination ? (
              /* Folder View */
              <>
                {denominations
                  .map(denom => {
                    let coinsInDenom;
                    let collectedInDenom;
                    if (denom === 'Purchased') {
                      const purchasedIds = purchasedCoins.map(p => p.coinId);
                      coinsInDenom = allCoins.filter(c => purchasedIds.includes(c.id));
                      collectedInDenom = coinsInDenom.length;
                    } else {
                      coinsInDenom = allCoins.filter(c => c.denomination === denom);
                      collectedInDenom = coinsInDenom.filter(c => collectedIds.includes(c.id)).length;
                    }
                    const denomProgress = coinsInDenom.length > 0 ? Math.round((collectedInDenom / coinsInDenom.length) * 100) : 0;
                    return { denom, coinsInDenom, collectedInDenom, denomProgress };
                  })
                  .sort((a, b) => b.denomProgress - a.denomProgress)
                  .map(({ denom, coinsInDenom, collectedInDenom, denomProgress }) => (
                    <motion.div
                      key={denom}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      onClick={() => setActiveDenomination(denom)}
                      className={`bg-white dark:bg-gray-900 rounded-2xl p-4 sm:p-5 shadow-sm border-2 border-transparent hover:border-amber-500 transition-all cursor-pointer flex items-center gap-3 sm:gap-4 ${
                        userProfile.settings?.isTextMode ? 'border-gray-100 dark:border-gray-800' : ''
                      }`}
                    >
                      {!userProfile.settings?.isTextMode && (
                        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-amber-100 dark:bg-amber-900/20 text-amber-600 rounded-2xl flex items-center justify-center">
                          <Folder size={28} className="sm:w-8 sm:h-8" fill="currentColor" fillOpacity={0.2} />
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Coin {denom}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          {!userProfile.settings?.isTextMode ? (
                            <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-amber-500" 
                                style={{ width: `${denomProgress}%` }}
                              />
                            </div>
                          ) : (
                            <span className="text-[10px] sm:text-xs font-bold text-amber-600 uppercase tracking-widest">{denomProgress}% Complete</span>
                          )}
                          <span className="text-[10px] sm:text-xs font-bold text-gray-500">{collectedInDenom}/{coinsInDenom.length}</span>
                        </div>
                      </div>
                      <ChevronRight className="text-gray-300 sm:w-6 sm:h-6" size={20} />
                    </motion.div>
                  ))}

                {/* Wishlist Folder */}
                {requestedCoins.length > 0 && (
                  <motion.div
                    key="Wishlist"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => setActiveDenomination('Wishlist')}
                    className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border-2 border-dashed border-amber-300 hover:border-amber-500 transition-all cursor-pointer flex items-center gap-3 sm:gap-4"
                  >
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center">
                      <Folder size={28} className="sm:w-8 sm:h-8" fill="currentColor" fillOpacity={0.1} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 italic">My Wishlist</h3>
                      <p className="text-xs sm:text-sm text-gray-500">{requestedCoins.length} coins requested</p>
                    </div>
                    <ChevronRight className="text-gray-300 sm:w-6 sm:h-6" size={20} />
                  </motion.div>
                )}
              </>
            ) : activeDenomination === 'Wishlist' ? (
              /* Wishlist View */
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-500">Coins you've requested for future updates:</p>
                  <button 
                    onClick={copyRequestsToClipboard}
                    className="flex items-center gap-2 text-amber-600 font-bold text-sm hover:underline"
                  >
                    <Clipboard size={16} /> Copy List
                  </button>
                </div>
                {requestedCoins.map((req) => (
                  <motion.div
                    key={req.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between"
                  >
                    <div>
                      <h4 className="text-lg font-bold text-gray-900">{req.denomination}</h4>
                      <p className="text-sm text-gray-500">Year: {req.year}</p>
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(req.timestamp).toLocaleDateString()}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              /* Coin List View */
              userProfile.settings?.isPurchaseMode ? (
                <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border-4 border-black dark:border-white overflow-hidden shadow-2xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-black dark:bg-white text-white dark:text-black">
                        <th className="p-4 sm:p-6 text-xl sm:text-2xl font-black uppercase tracking-widest">Coin</th>
                        <th className="p-4 sm:p-6 text-xl sm:text-2xl font-black uppercase tracking-widest">Year</th>
                        <th className="p-4 sm:p-6 text-xl sm:text-2xl font-black uppercase tracking-widest text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCoins.map((coin) => {
                        const isCollected = collectedIds.includes(coin.id);
                        return (
                          <tr 
                            key={coin.id}
                            onClick={() => handleSelectCoin(coin)}
                            className={`border-b-4 border-gray-100 dark:border-gray-800 cursor-pointer active:bg-gray-100 dark:active:bg-gray-800 ${
                              isCollected ? 'bg-amber-50 dark:bg-amber-900/10' : ''
                            }`}
                          >
                            <td className="p-4 sm:p-6">
                              <p className="text-2xl sm:text-4xl font-black text-gray-900 dark:text-white leading-tight">{coin.denomination}</p>
                              <p className="text-sm sm:text-lg font-bold text-gray-500 dark:text-gray-400 truncate max-w-[150px] sm:max-w-[300px]">{coin.name}</p>
                            </td>
                            <td className="p-4 sm:p-6 text-2xl sm:text-4xl font-black text-gray-900 dark:text-white">
                              {coin.year}
                            </td>
                            <td className="p-4 sm:p-6 text-center">
                              {isCollected ? (
                                <div className="inline-flex items-center justify-center w-10 h-10 sm:w-14 sm:h-14 bg-amber-500 text-white rounded-full shadow-lg">
                                  <CheckCircle2 size={24} className="sm:w-8 sm:h-8" />
                                </div>
                              ) : (
                                <div className="inline-flex items-center justify-center w-10 h-10 sm:w-14 sm:h-14 border-4 border-gray-200 dark:border-gray-700 rounded-full">
                                  <Circle size={24} className="sm:w-8 sm:h-8 text-gray-200 dark:text-gray-700" />
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                filteredCoins.map((coin) => {
                  const isCollected = collectedIds.includes(coin.id);
                  return (
                    <motion.div
                      layout
                      key={coin.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      onClick={() => handleSelectCoin(coin)}
                      className={`group relative bg-white dark:bg-gray-900 rounded-2xl shadow-sm border-2 transition-all cursor-pointer ${
                        isCollected ? 'border-amber-500 bg-amber-50/30 dark:bg-amber-900/10' : 'border-transparent'
                      } ${
                        userProfile.settings?.isCompactUI ? 'p-2 sm:p-3' : 'p-3 sm:p-4'
                      } ${
                        userProfile.settings?.isTextMode ? 'border-gray-100 dark:border-gray-800' : ''
                      }`}
                    >
                      <div className="flex gap-3 sm:gap-4 items-center">
                        {!userProfile.settings?.isTextMode && (
                          <div className={`relative flex-shrink-0 ${
                            userProfile.settings?.isCompactUI ? 'w-12 h-12 sm:w-16 sm:h-16' : 'w-16 h-16 sm:w-20 sm:h-20'
                          }`}>
                            <img 
                              src={coin.imageUrl} 
                              alt={coin.name}
                              referrerPolicy="no-referrer"
                              onError={handleImageError}
                              className={`w-full h-full object-cover rounded-full border-2 border-gray-100 dark:border-gray-800 ${
                                !isCollected && 'grayscale opacity-50'
                              }`}
                            />
                            {isCollected && (
                              <div className={`absolute -top-1 -right-1 bg-amber-500 text-white rounded-full p-0.5 sm:p-1 shadow-md ${
                                userProfile.settings?.isCompactUI ? 'scale-75' : ''
                              }`}>
                                <CheckCircle2 size={14} className="sm:w-4 sm:h-4" />
                              </div>
                            )}
                            {coin.rarity && coin.rarity !== 'Common' && (
                              <div className={`absolute -bottom-1 -left-1 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest shadow-sm z-10 ${
                                coin.rarity === 'Ultra Rare' ? 'bg-purple-500 text-white' : 
                                coin.rarity === 'Rare' ? 'bg-amber-500 text-white' : 
                                'bg-blue-500 text-white'
                              }`}>
                                {coin.rarity}
                              </div>
                            )}
                          </div>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5 sm:mb-1">
                            <div className="flex items-center gap-2">
                              {userProfile.settings?.isTextMode && isCollected && <CheckCircle2 size={14} className="text-amber-500" />}
                              <span className="text-[10px] sm:text-xs font-bold text-amber-600 uppercase tracking-widest">
                                {coin.denomination} • {coin.year}
                              </span>
                              {userProfile.settings?.isTextMode && coin.rarity && coin.rarity !== 'Common' && (
                                <span className={`text-[8px] font-black uppercase tracking-widest ${
                                  coin.rarity === 'Ultra Rare' ? 'text-purple-500' : 
                                  coin.rarity === 'Rare' ? 'text-amber-500' : 
                                  'text-blue-500'
                                }`}>
                                  [{coin.rarity}]
                                </span>
                              )}
                            </div>
                            {userProfile.settings?.showCoinPrice && coin.value && (
                              <div className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg text-[10px] sm:text-xs font-black">
                                £{coin.value.toFixed(2)}
                              </div>
                            )}
                          </div>
                          <h3 className={`font-bold text-gray-900 dark:text-white truncate ${
                            userProfile.settings?.isCompactUI ? 'text-base sm:text-lg' : 'text-lg sm:text-xl'
                          }`}>{coin.name}</h3>
                          {!userProfile.settings?.isTextMode && (
                            <p className={`text-gray-500 dark:text-gray-400 line-clamp-1 ${
                              userProfile.settings?.isCompactUI ? 'text-[10px] sm:text-xs' : 'text-xs sm:text-sm'
                            }`}>{coin.description}</p>
                          )}
                        </div>

                        <button
                          onClick={(e) => toggleCollected(coin.id, e)}
                          className={`rounded-xl transition-all ${
                            isCollected 
                              ? 'bg-amber-500 text-white shadow-lg shadow-amber-200 dark:shadow-none' 
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                          } ${
                            userProfile.settings?.isCompactUI ? 'p-2 sm:p-2.5' : 'p-2.5 sm:p-3'
                          }`}
                          aria-label={isCollected ? "Mark as missing" : "Mark as collected"}
                        >
                          {isCollected ? <CheckCircle2 size={userProfile.settings?.isCompactUI ? 18 : 20} className="sm:w-6 sm:h-6" /> : <Circle size={userProfile.settings?.isCompactUI ? 18 : 20} className="sm:w-6 sm:h-6" />}
                        </button>
                      </div>
                    </motion.div>
                  );
                })
              )
            )}
          </AnimatePresence>

          {activeDenomination && filteredCoins.length === 0 && activeDenomination !== 'Wishlist' && (
            <div className="text-center py-12">
              <div className="text-gray-300 mb-4 flex justify-center">
                <Search size={64} />
              </div>
              <h3 className="text-xl font-bold text-gray-900">No coins found</h3>
              <p className="text-gray-500">Try a different search or filter</p>
            </div>
          )}
        </div>
      </main>

      {/* Loading Overlay for Photo Analysis */}
      <AnimatePresence>
        {isAnalyzing && !isScanning && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md">
            <div className="text-center text-white p-8">
              <Loader2 size={64} className="mx-auto mb-4 animate-spin text-amber-500" />
              <h2 className="text-2xl font-bold mb-2">Analyzing Photo...</h2>
              <p className="text-gray-400">Gemini AI is identifying your coin</p>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Scanner Overlay */}
      <AnimatePresence>
        {isScanning && (
          <div className="fixed inset-0 z-[60] flex flex-col bg-black">
            <div className="relative flex-1">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="w-full h-full object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />
              
              {/* Scanner Frame */}
              <div className="absolute inset-0 flex items-center justify-center p-12">
                <div className="w-full aspect-square border-4 border-amber-500 rounded-full relative">
                  <div className="absolute inset-0 border-4 border-white/20 rounded-full animate-pulse" />
                </div>
              </div>

              {/* Scanner Controls */}
              <div className="absolute top-6 left-6 right-6 flex justify-between items-center">
                <button 
                  onClick={stopScanner}
                  className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white"
                >
                  <X size={24} />
                </button>
                <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-full text-white text-sm font-bold flex items-center gap-2">
                  <Sparkles size={16} className="text-amber-400" />
                  AI Coin Scanner
                </div>
              </div>

              {/* Result Preview */}
              <AnimatePresence>
                {scanResult && !isAnalyzing && (
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="absolute bottom-28 sm:bottom-32 left-4 right-4 sm:left-6 sm:right-6 bg-white rounded-2xl p-3 sm:p-4 shadow-2xl"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="text-[10px] sm:text-sm font-bold text-gray-400 uppercase tracking-widest">Identified As</h4>
                        <p className="text-lg sm:text-xl font-bold text-gray-900">
                          {scanResult.denomination} ({scanResult.year || 'Unknown Year'})
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            setIsAddingToCollection(true);
                            setIsRequestModalOpen(true);
                            stopScanner();
                          }}
                          className="flex-1 sm:flex-none px-3 py-2 bg-amber-500 text-white rounded-xl font-bold text-xs sm:text-sm shadow-lg shadow-amber-200"
                        >
                          Add
                        </button>
                        <button 
                          onClick={() => {
                            setIsAddingToCollection(false);
                            setIsRequestModalOpen(true);
                            stopScanner();
                          }}
                          className="flex-1 sm:flex-none px-3 py-2 bg-amber-100 text-amber-600 rounded-xl font-bold text-xs sm:text-sm"
                        >
                          Request
                        </button>
                        <button 
                          onClick={() => setScanResult(null)}
                          className="flex-1 sm:flex-none px-3 py-2 bg-gray-100 text-gray-600 rounded-xl font-bold text-xs sm:text-sm"
                        >
                          Retry
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Scan Button */}
              <div className="absolute bottom-10 left-0 right-0 flex justify-center">
                <button
                  onClick={captureAndAnalyze}
                  disabled={isAnalyzing}
                  className={`w-20 h-20 rounded-full border-4 border-white flex items-center justify-center transition-all ${
                    isAnalyzing ? 'bg-gray-400' : 'bg-amber-500 shadow-xl shadow-amber-500/40'
                  }`}
                >
                  {isAnalyzing ? (
                    <Loader2 size={40} className="text-white animate-spin" />
                  ) : (
                    <div className="w-16 h-16 rounded-full border-2 border-white/50" />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Request Coin Modal */}
      <AnimatePresence>
        {isRequestModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsRequestModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {isAddingToCollection ? 'Add to Collection' : 'Request a Coin'}
                </h2>
                <button onClick={() => setIsRequestModalOpen(false)} className="text-gray-400">
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={handleRequestSubmit} className="space-y-6">
                {isAddingToCollection && (
                  <div>
                    <label className="block text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">
                      Coin Name (Optional)
                    </label>
                    <input 
                      type="text"
                      value={reqName}
                      onChange={(e) => setReqName(e.target.value)}
                      className="w-full p-4 bg-gray-100 border-none rounded-xl text-lg outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="e.g. My Special Penny"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">
                    Denomination
                  </label>
                  <select 
                    value={reqDenom}
                    onChange={(e) => setReqDenom(e.target.value)}
                    className="w-full p-4 bg-gray-100 border-none rounded-xl text-lg outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {['£2', '£1', 'Half Crown', '1 Shilling', '50p', '3p', '1p', '1/2p'].map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">
                    Year
                  </label>
                  <input 
                    type="number"
                    value={reqYear}
                    onChange={(e) => setReqYear(parseInt(e.target.value))}
                    className="w-full p-4 bg-gray-100 border-none rounded-xl text-lg outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="e.g. 1965"
                    min="1800"
                    max="2099"
                    required
                  />
                </div>

                {isAddingToCollection && (
                  <div>
                    <label className="block text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">
                      Photo
                    </label>
                    {reqPhoto ? (
                      <div className="relative w-32 h-32 rounded-2xl overflow-hidden border-2 border-amber-500">
                        <img src={reqPhoto} alt="Captured" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                        <button 
                          type="button"
                          onClick={() => setReqPhoto(null)}
                          className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setIsRequestModalOpen(false);
                          startScanner();
                        }}
                        className="w-full p-4 bg-gray-100 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
                      >
                        <Camera size={20} /> Take Photo
                      </button>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-4 bg-amber-500 text-white rounded-2xl text-xl font-bold shadow-xl shadow-amber-200 hover:bg-amber-600 transition-all flex items-center justify-center gap-2"
                >
                  <Send size={20} /> {isAddingToCollection ? 'Add to Collection' : 'Submit Request'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Profile Modal */}
      <AnimatePresence>
        {isProfileOpen && (
          <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="bg-gray-50 dark:bg-gray-950 w-full max-w-2xl rounded-t-3xl sm:rounded-3xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-4 sm:p-6 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between sticky top-0 z-10">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Your Profile</h2>
                <button 
                  onClick={() => setIsProfileOpen(false)}
                  className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                >
                  <X size={20} className="sm:w-6 sm:h-6 text-gray-500" />
                </button>
              </div>

              <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6">
                {/* Bento Grid Layout */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  
                  {/* User Info Block */}
                  <div className="sm:col-span-2 bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-3 sm:gap-4">
                    <img 
                      src={userProfile.avatar} 
                      alt="Avatar" 
                      referrerPolicy="no-referrer"
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-100 dark:border-amber-900/30"
                    />
                    <div>
                      <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{userProfile.name}</h3>
                      <p className="text-amber-600 dark:text-amber-400 font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center gap-1">
                        <Award size={14} className="sm:w-4 sm:h-4" />
                        {userProfile.rank}
                      </p>
                      <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm flex items-center gap-1 mt-0.5 sm:mt-1">
                        <Calendar size={12} className="sm:w-3.5 sm:h-3.5" />
                        Joined {userProfile.joinDate}
                      </p>
                    </div>
                  </div>

                  {/* Spend Block */}
                  <div className="sm:col-span-3 bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Total Spend</h4>
                      <p className="text-2xl font-black text-gray-900 dark:text-white">£{(userProfile.totalSpend || 0).toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Monthly Total</h4>
                      <p className="text-xl font-bold text-amber-600 dark:text-amber-400">£{monthlyTotal.toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Streak Block */}
                  <div className="bg-orange-500 p-4 sm:p-6 rounded-3xl shadow-lg text-white flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <Award size={20} className="sm:w-6 sm:h-6" />
                      <span className="text-3xl font-black">{userProfile.streak}</span>
                    </div>
                    <div>
                      <p className="text-orange-100 text-xs font-bold uppercase tracking-widest">Daily</p>
                      <p className="text-lg font-bold">Streak</p>
                    </div>
                  </div>

                  {/* Progress Block */}
                  <div className="bg-amber-500 p-6 rounded-3xl shadow-lg text-white flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <BarChart3 size={24} />
                      <span className="text-3xl font-black">{progress}%</span>
                    </div>
                    <div>
                      <p className="text-amber-100 text-xs font-bold uppercase tracking-widest">Collection</p>
                      <p className="text-lg font-bold">Progress</p>
                    </div>
                  </div>

                  {/* Stats Block - Points & Level */}
                  <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-3xl font-black text-gray-900 dark:text-white">{userProfile.points.toLocaleString()}</p>
                      <div className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg text-[10px] font-bold uppercase tracking-widest">
                        Lvl {currentLevel}
                      </div>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-3">{levelName}</p>
                    
                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-1">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${levelProgress}%` }}
                        className="h-full bg-amber-500 rounded-full"
                      />
                    </div>
                    <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      <span>{userProfile.points % 2000} XP</span>
                      <span>2,000 XP</span>
                    </div>
                  </div>

                  {/* Stats Block - Total Spend */}
                  <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
                    <p className="text-3xl font-black text-gray-900 dark:text-white">£{(userProfile.totalSpend || 0).toFixed(2)}</p>
                    <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Spend</p>
                    <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-blue-500 uppercase tracking-widest">
                      <TrendingUp size={14} />
                      Investment
                    </div>
                  </div>

                  {/* Stats Block - Points & Level */}
                  <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-3xl font-black text-gray-900 dark:text-white">{userProfile.points.toLocaleString()}</p>
                      <div className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg text-[10px] font-bold uppercase tracking-widest">
                        Lvl {currentLevel}
                      </div>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-3">{levelName}</p>
                    
                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-1">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${levelProgress}%` }}
                        className="h-full bg-amber-500 rounded-full"
                      />
                    </div>
                    <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      <span>{userProfile.points % 2000} XP</span>
                      <span>2,000 XP</span>
                    </div>
                  </div>

                  {/* Stats Block - Total Spend */}
                  <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
                    <p className="text-3xl font-black text-gray-900 dark:text-white">£{(userProfile.totalSpend || 0).toFixed(2)}</p>
                    <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Spend</p>
                    <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-blue-500 uppercase tracking-widest">
                      <TrendingUp size={14} />
                      Investment
                    </div>
                  </div>

                  {/* Stats Block - Total Coins */}
                  <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
                    <p className="text-3xl font-black text-gray-900 dark:text-white">{collectedIds.length}</p>
                    <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Coins Collected</p>
                    <div className="mt-4 h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 w-full opacity-20" />
                    </div>
                  </div>

                  {/* Stats Block - Unique Denoms */}
                  <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
                    <p className="text-3xl font-black text-gray-900 dark:text-white">{denominations.length}</p>
                    <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Denominations</p>
                    <div className="mt-4 flex gap-1">
                      {[1,2,3,4,5].map(i => (
                        <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= 3 ? 'bg-amber-500' : 'bg-gray-100 dark:bg-gray-800'}`} />
                      ))}
                    </div>
                  </div>

                  {/* Stats Block - Custom Coins */}
                  <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
                    <p className="text-3xl font-black text-gray-900 dark:text-white">{customCoins.length}</p>
                    <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Custom Finds</p>
                    <div className="mt-4 flex -space-x-2">
                      {customCoins.slice(0, 3).map((c, i) => (
                        <div key={i} className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-900 bg-gray-100 dark:bg-gray-800 overflow-hidden">
                          <img 
                            src={c.imageUrl} 
                            alt="" 
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover" 
                          />
                        </div>
                      ))}
                      {customCoins.length > 3 && (
                        <div className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-900 bg-gray-900 dark:bg-gray-100 flex items-center justify-center text-[10px] text-white dark:text-gray-900 font-bold">
                          +{customCoins.length - 3}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Badges Block */}
                  {userProfile.badges.length > 0 && (
                    <div className="sm:col-span-3 bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
                      <h4 className="font-bold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                        <Trophy size={16} className="text-amber-500 sm:w-[18px] sm:h-[18px]" />
                        Achievement Badges
                      </h4>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        {userProfile.badges.map(badge => (
                          <div key={badge} className="px-3 py-1.5 sm:px-4 sm:py-2 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-full text-[10px] sm:text-xs font-bold border border-amber-100 dark:border-amber-900/30 flex items-center gap-1.5 sm:gap-2">
                            <Award size={12} className="sm:w-3.5 sm:h-3.5" />
                            {badge}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent Activity Block */}
                  <div className="sm:col-span-3 bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
                    <h4 className="font-bold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                      <Sparkles size={16} className="text-amber-500 sm:w-[18px] sm:h-[18px]" />
                      Recent Discoveries
                    </h4>
                    <div className="space-y-2 sm:space-y-3">
                      {collectedIds.slice(-3).reverse().map(id => {
                        const coin = allCoins.find(c => c.id === id);
                        if (!coin) return null;
                        return (
                          <div key={id} className="flex items-center justify-between p-2.5 sm:p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 overflow-hidden">
                                <img 
                                  src={coin.imageUrl} 
                                  alt="" 
                                  referrerPolicy="no-referrer"
                                  onError={handleImageError}
                                  className="w-full h-full object-cover" 
                                />
                              </div>
                              <div>
                                <p className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white leading-tight">{coin.name}</p>
                                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">{coin.denomination} • {coin.year}</p>
                              </div>
                            </div>
                            <CheckCircle2 size={16} className="text-green-500 sm:w-[18px] sm:h-[18px]" />
                          </div>
                        );
                      })}
                      {collectedIds.length === 0 && (
                        <p className="text-center py-4 text-gray-400 text-xs sm:text-sm italic">No coins collected yet. Start scanning!</p>
                      )}
                    </div>
                  </div>

                </div>

                {/* Missions Section */}
                <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 mb-4">
                  <h4 className="font-bold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                    <Target size={16} className="text-blue-500 sm:w-[18px] sm:h-[18px]" />
                    Daily & Weekly Missions
                  </h4>
                  <div className="space-y-2">
                    {userProfile.missions.map(mission => (
                      <div key={mission.id} className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${mission.isCompleted ? 'bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-900/30' : 'bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700'}`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${mission.isCompleted ? 'bg-green-500 text-white' : 'bg-white dark:bg-gray-700 text-gray-400'}`}>
                            {mission.isCompleted ? <CheckCircle size={16} /> : <Circle size={16} />}
                          </div>
                          <div>
                            <p className={`font-bold text-xs sm:text-sm leading-tight ${mission.isCompleted ? 'text-green-700 dark:text-green-400 line-through opacity-60' : 'text-gray-900 dark:text-white'}`}>{mission.title}</p>
                            <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">{mission.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-black text-xs sm:text-sm ${mission.isCompleted ? 'text-green-600' : 'text-blue-500'}`}>+{mission.reward}</p>
                          <p className="text-[8px] sm:text-[10px] uppercase font-bold text-gray-400 tracking-widest">{mission.type}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <button 
                    onClick={() => setIsSpinModalOpen(true)}
                    className="py-3 sm:py-4 bg-gradient-to-br from-amber-400 to-orange-500 text-white font-bold rounded-2xl hover:from-amber-500 hover:to-orange-600 transition-all flex items-center justify-center gap-1.5 sm:gap-2 shadow-lg text-sm sm:text-base"
                  >
                    <Dices size={18} className="sm:w-5 sm:h-5" />
                    Lucky Spin
                  </button>
                  <button 
                    onClick={() => setIsPurchasedAddOpen(true)}
                    className="py-3 sm:py-4 bg-blue-500 text-white font-bold rounded-2xl hover:bg-blue-600 transition-all flex items-center justify-center gap-1.5 sm:gap-2 shadow-lg text-sm sm:text-base"
                  >
                    <Folder size={18} className="sm:w-5 sm:h-5" />
                    Purchased
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <button 
                    onClick={() => setIsPhotoLibraryOpen(true)}
                    className="py-3 sm:py-4 bg-purple-500 text-white font-bold rounded-2xl hover:bg-purple-600 transition-all flex items-center justify-center gap-1.5 sm:gap-2 shadow-lg text-sm sm:text-base"
                  >
                    <Camera size={18} className="sm:w-5 sm:h-5" />
                    Library
                  </button>
                  <button 
                    onClick={exportCollection}
                    className="py-3 sm:py-4 bg-gray-900 text-white font-bold rounded-2xl hover:bg-black transition-all flex items-center justify-center gap-1.5 sm:gap-2 shadow-lg text-sm sm:text-base"
                  >
                    <Share size={18} className="sm:w-5 sm:h-5" />
                    Export
                  </button>
                </div>

                <div className="grid grid-cols-1 mb-3 sm:mb-4">
                  <button 
                    onClick={importCollection}
                    className="py-3 sm:py-4 bg-white text-gray-900 border-2 border-gray-100 font-bold rounded-2xl hover:bg-gray-50 transition-all flex items-center justify-center gap-1.5 sm:gap-2 text-sm sm:text-base"
                  >
                    <RefreshCw size={18} className="sm:w-5 sm:h-5" />
                    Import Data
                  </button>
                </div>

                <button 
                  onClick={() => {
                    addPoints(POINT_VALUES.DAILY_CHECKIN, "Daily Reward Claimed!");
                    alert("You've claimed your daily 50 points! Come back tomorrow for more.");
                  }}
                  className="w-full py-3.5 sm:py-4 bg-amber-500 text-white font-bold rounded-2xl hover:bg-amber-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-100 mb-3 sm:mb-4 text-sm sm:text-base"
                >
                  <Award size={18} className="sm:w-5 sm:h-5" />
                  Claim Daily Reward (+50)
                </button>

                {/* Settings Section */}
                <div className="bg-gray-50 dark:bg-gray-800 p-4 sm:p-6 rounded-3xl border border-gray-100 dark:border-gray-700 mb-4">
                  <h4 className="font-bold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                    <Settings size={16} className="text-gray-500 sm:w-[18px] sm:h-[18px]" />
                    App Settings
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center text-gray-500">
                          <Settings size={16} />
                        </div>
                        <div>
                          <p className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white">Follow System Theme</p>
                          <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Sync with device settings</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          setUserProfile(prev => ({
                            ...prev,
                            settings: {
                              ...prev.settings,
                              followSystemTheme: !prev.settings?.followSystemTheme
                            }
                          }));
                        }}
                        className={`w-12 h-6 rounded-full transition-all relative ${userProfile.settings?.followSystemTheme ? 'bg-amber-500' : 'bg-gray-200 dark:bg-gray-700'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${userProfile.settings?.followSystemTheme ? 'right-1' : 'left-1'}`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center text-gray-500">
                          <BarChart3 size={16} />
                        </div>
                        <div>
                          <p className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white">Compact UI</p>
                          <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Reduce spacing and sizes</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          setUserProfile(prev => ({
                            ...prev,
                            settings: {
                              ...prev.settings,
                              isCompactUI: !prev.settings?.isCompactUI
                            }
                          }));
                        }}
                        className={`w-12 h-6 rounded-full transition-all relative ${userProfile.settings?.isCompactUI ? 'bg-amber-500' : 'bg-gray-200 dark:bg-gray-700'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${userProfile.settings?.isCompactUI ? 'right-1' : 'left-1'}`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center text-gray-500">
                          <Layout size={16} />
                        </div>
                        <div>
                          <p className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white">Text Mode UI</p>
                          <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Minimal text-only layout</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          setUserProfile(prev => ({
                            ...prev,
                            settings: {
                              ...prev.settings,
                              isTextMode: !prev.settings?.isTextMode
                            }
                          }));
                        }}
                        className={`w-12 h-6 rounded-full transition-all relative ${userProfile.settings?.isTextMode ? 'bg-amber-500' : 'bg-gray-200 dark:bg-gray-700'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${userProfile.settings?.isTextMode ? 'right-1' : 'left-1'}`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center text-gray-500">
                          <ImageOff size={16} />
                        </div>
                        <div>
                          <p className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white">Background Removal</p>
                          <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Enable AI image processing</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          setUserProfile(prev => ({
                            ...prev,
                            settings: {
                              ...prev.settings,
                              isBackgroundRemovalEnabled: !prev.settings?.isBackgroundRemovalEnabled
                            }
                          }));
                        }}
                        className={`w-12 h-6 rounded-full transition-all relative ${userProfile.settings?.isBackgroundRemovalEnabled ? 'bg-amber-500' : 'bg-gray-200 dark:bg-gray-700'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${userProfile.settings?.isBackgroundRemovalEnabled ? 'right-1' : 'left-1'}`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center text-gray-500">
                          <BarChart3 size={16} />
                        </div>
                        <div>
                          <p className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white">Bottom Navigation</p>
                          <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Enable bottom menu bar</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          setUserProfile(prev => ({
                            ...prev,
                            settings: {
                              ...prev.settings,
                              showBottomMenu: !prev.settings?.showBottomMenu
                            }
                          }));
                        }}
                        className={`w-12 h-6 rounded-full transition-all relative ${userProfile.settings?.showBottomMenu ? 'bg-amber-500' : 'bg-gray-200 dark:bg-gray-700'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${userProfile.settings?.showBottomMenu ? 'right-1' : 'left-1'}`} />
                      </button>
                    </div>

                    {/* Recovery Code Section */}
                    <div className="p-3 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/20 rounded-xl flex items-center justify-center text-amber-600">
                            <Shield size={16} />
                          </div>
                          <div>
                            <p className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white">Recovery Code</p>
                            <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Save this to recover your data</p>
                          </div>
                        </div>
                        <button 
                          onClick={generateRecoveryCode}
                          className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl text-[10px] font-bold hover:bg-gray-200 transition-colors"
                        >
                          {userProfile.recoveryCode ? 'Regenerate' : 'Generate'}
                        </button>
                      </div>
                      {userProfile.recoveryCode && (
                        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-xl flex items-center justify-between border border-gray-100 dark:border-gray-700">
                          <code className="text-xs font-mono font-bold text-gray-900 dark:text-white tracking-widest">
                            {userProfile.recoveryCode}
                          </code>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(userProfile.recoveryCode!);
                              alert("Recovery code copied to clipboard!");
                            }}
                            className="text-amber-600 hover:text-amber-700"
                          >
                            <Copy size={14} />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center text-gray-500">
                          <RefreshCw size={16} />
                        </div>
                        <div>
                          <p className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white">Data Conversion</p>
                          <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Convert old data formats</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          // Check if there's old data in localStorage to convert
                          const oldData = {
                            collected_coins: JSON.parse(localStorage.getItem('collected_coins') || 'null'),
                            custom_coins: JSON.parse(localStorage.getItem('custom_coins') || 'null'),
                            requested_coins: JSON.parse(localStorage.getItem('requested_coins') || 'null'),
                            user_profile: JSON.parse(localStorage.getItem('user_profile') || 'null'),
                            user_coin_images: JSON.parse(localStorage.getItem('user_coin_images') || 'null'),
                          };
                          
                          if (oldData.collected_coins || oldData.custom_coins || oldData.requested_coins || oldData.user_profile) {
                            setConversionData(oldData);
                            setIsConverting(true);
                          } else {
                            alert("No old data format detected in local storage.");
                          }
                        }}
                        className="px-3 py-1.5 bg-amber-100 text-amber-600 font-bold rounded-xl text-[10px] sm:text-xs hover:bg-amber-200 transition-colors"
                      >
                        Check
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center text-gray-500">
                          <Table size={16} />
                        </div>
                        <div>
                          <p className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white">Purchase Mode</p>
                          <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Senior-friendly table view</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          setUserProfile(prev => ({
                            ...prev,
                            settings: {
                              ...prev.settings,
                              isPurchaseMode: !prev.settings?.isPurchaseMode
                            }
                          }));
                        }}
                        className={`w-12 h-6 rounded-full transition-all relative ${userProfile.settings?.isPurchaseMode ? 'bg-amber-500' : 'bg-gray-200 dark:bg-gray-700'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${userProfile.settings?.isPurchaseMode ? 'right-1' : 'left-1'}`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center text-gray-500">
                          <Tag size={16} />
                        </div>
                        <div>
                          <p className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white">Show Coin Price</p>
                          <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Display price in normal mode</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          setUserProfile(prev => ({
                            ...prev,
                            settings: {
                              ...prev.settings,
                              showCoinPrice: !prev.settings?.showCoinPrice
                            }
                          }));
                        }}
                        className={`w-12 h-6 rounded-full transition-all relative ${userProfile.settings?.showCoinPrice ? 'bg-amber-500' : 'bg-gray-200 dark:bg-gray-700'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${userProfile.settings?.showCoinPrice ? 'right-1' : 'left-1'}`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center text-gray-500">
                          {userProfile.settings?.isDarkMode ? <Sparkles size={16} /> : <Award size={16} />}
                        </div>
                        <div>
                          <p className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white">Dark Mode</p>
                          <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Enable night theme</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          setUserProfile(prev => ({
                            ...prev,
                            settings: {
                              ...prev.settings,
                              isDarkMode: !prev.settings?.isDarkMode
                            }
                          }));
                        }}
                        className={`w-12 h-6 rounded-full transition-all relative ${userProfile.settings?.isDarkMode ? 'bg-amber-500' : 'bg-gray-200 dark:bg-gray-700'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${userProfile.settings?.isDarkMode ? 'right-1' : 'left-1'}`} />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <button 
                        onClick={refreshApp}
                        className="flex flex-col items-center justify-center p-3 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <RefreshCw size={18} className="text-blue-500 mb-1" />
                        <span className="text-[10px] font-bold text-gray-900 dark:text-white uppercase tracking-widest">Refresh App</span>
                      </button>
                      <button 
                        onClick={clearCache}
                        className="flex flex-col items-center justify-center p-3 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <Trash2 size={18} className="text-red-500 mb-1" />
                        <span className="text-[10px] font-bold text-gray-900 dark:text-white uppercase tracking-widest">Clear Cache</span>
                      </button>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    // Simple name edit for demo
                    const newName = prompt("Enter your name:", userProfile.name);
                    if (newName) setUserProfile(prev => ({ ...prev, name: newName }));
                  }}
                  className="w-full py-3.5 sm:py-4 bg-gray-100 text-gray-700 font-bold rounded-2xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  <Settings size={18} className="sm:w-5 sm:h-5" />
                  Edit Profile Settings
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Lucky Spin Modal */}
      <AnimatePresence>
        {isSpinModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSpinModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-sm bg-white dark:bg-gray-900 rounded-[32px] overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-800 p-6 text-center"
            >
              <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/20 rounded-full flex items-center justify-center text-amber-500 mx-auto mb-4">
                <Dices size={40} />
              </div>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Daily Lucky Spin</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                Spin the wheel to win bonus points! You can spin once every 24 hours.
              </p>

              {userProfile.lastSpinDate === new Date().toISOString().split('T')[0] ? (
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 mb-6">
                  <p className="text-gray-600 dark:text-gray-300 font-bold text-sm flex items-center justify-center gap-2">
                    <Clock size={16} />
                    Already spun today!
                  </p>
                  <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest font-black">Come back tomorrow</p>
                </div>
              ) : (
                <button 
                  onClick={() => {
                    const winAmount = Math.floor(Math.random() * (POINT_VALUES.LUCKY_SPIN_MAX - POINT_VALUES.LUCKY_SPIN_MIN + 1)) + POINT_VALUES.LUCKY_SPIN_MIN;
                    addPoints(winAmount, `Lucky Spin Win: +${winAmount} XP!`);
                    setUserProfile(prev => ({
                      ...prev,
                      lastSpinDate: new Date().toISOString().split('T')[0]
                    }));
                    setIsSpinModalOpen(false);
                    completeMission('m2');
                  }}
                  className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black rounded-2xl hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg shadow-amber-200 dark:shadow-none mb-4 uppercase tracking-widest"
                >
                  Spin Now!
                </button>
              )}

              <button 
                onClick={() => setIsSpinModalOpen(false)}
                className="w-full py-3 text-gray-400 font-bold text-sm hover:text-gray-600 transition-colors"
              >
                Maybe Later
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Coin Detail Modal */}
      <AnimatePresence>
        {selectedCoin && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setSelectedCoin(null);
                setIsZoomed(false);
              }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className={`relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl transition-all duration-300 ${
                isZoomed ? 'h-[90vh] sm:h-auto' : ''
              }`}
            >
              <div className={`relative transition-all duration-500 ${isZoomed ? 'h-full' : 'h-56 sm:h-80'}`}>
                <img 
                  src={selectedCoin.imageUrl} 
                  alt={selectedCoin.name}
                  referrerPolicy="no-referrer"
                  onError={handleImageError}
                  onClick={() => setIsZoomed(!isZoomed)}
                  className={`w-full h-full object-cover cursor-zoom-in transition-transform duration-500 ${
                    isZoomed ? 'object-contain bg-black cursor-zoom-out' : ''
                  }`}
                />
                <div className="absolute top-3 left-3 sm:top-4 sm:left-4 flex flex-wrap gap-2">
                  <button 
                    onClick={() => changeCoinImage(selectedCoin.id)}
                    className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-md transition-all z-10 border border-white/20 group"
                    title="Change Image"
                  >
                    <Camera size={16} className="sm:w-[18px] sm:h-[18px] group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest">Update Photo</span>
                  </button>
                  <button 
                    onClick={() => editCoin(selectedCoin)}
                    className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-md transition-all z-10 border border-white/20 group"
                    title="Edit Coin"
                  >
                    <Edit size={16} className="sm:w-[18px] sm:h-[18px] group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest">Edit Details</span>
                  </button>
                  <button 
                    onClick={() => {
                      setWebSearchQuery(selectedCoin.name);
                      setIsWebSearchOpen(true);
                      searchWebImages(selectedCoin.name);
                    }}
                    className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-md transition-all z-10 border border-white/20 group"
                    title="Search Web"
                  >
                    <Globe size={16} className="sm:w-[18px] sm:h-[18px] group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest">Search Web</span>
                  </button>
                </div>
                <button 
                  onClick={() => {
                    setSelectedCoin(null);
                    setIsZoomed(false);
                  }}
                  className="absolute top-3 right-3 sm:top-4 sm:right-4 p-1.5 sm:p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-colors z-10"
                >
                  <X size={20} className="sm:w-6 sm:h-6" />
                </button>
                {!isZoomed && (
                  <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-t from-black/80 to-transparent text-white">
                    <span className="text-xs sm:text-sm font-bold uppercase tracking-widest text-amber-400">
                      {selectedCoin.id.startsWith('custom-') ? 'Personal Discovery' : `${selectedCoin.denomination} • ${selectedCoin.year}`}
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-bold">{selectedCoin.name}</h2>
                    {userProfile.settings?.showCoinPrice && selectedCoin.value && (
                      <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-green-500/30 text-green-400 rounded-full text-xs font-black border border-green-500/50 backdrop-blur-md">
                        <Tag size={12} />
                        Est. Value: £{selectedCoin.value.toFixed(2)}
                      </div>
                    )}
                    <p className="text-[10px] sm:text-xs mt-0.5 sm:mt-1 opacity-70">Tap image to compare / zoom</p>
                  </div>
                )}
              </div>
              
              {!isZoomed && (
                <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                  <div className="flex items-center justify-between">
                    <button 
                      onClick={() => {
                        setWebSearchQuery(selectedCoin.name);
                        setIsWebSearchOpen(true);
                        searchWebImages(selectedCoin.name);
                      }}
                      className="flex items-center gap-2 text-amber-600 font-bold text-xs sm:text-sm hover:underline"
                    >
                      <Globe size={16} /> Search on Google Images
                    </button>
                    <p className="text-[10px] sm:text-xs text-gray-400 font-medium uppercase tracking-widest">
                      Update Image
                    </p>
                  </div>
                  <div className="flex items-center justify-between bg-amber-50 p-3 sm:p-4 rounded-2xl border border-amber-100">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="p-1.5 sm:p-2 bg-amber-500 text-white rounded-xl">
                        <Award size={20} className="sm:w-6 sm:h-6" />
                      </div>
                      <div>
                        <p className="text-[10px] sm:text-xs font-bold text-amber-600 uppercase tracking-widest leading-tight">Collector Points</p>
                        <p className="text-xl sm:text-2xl font-black text-gray-900 leading-none">{userProfile.points.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest leading-tight">Level</p>
                      <p className="text-xl sm:text-2xl font-black text-amber-500 leading-none">{userProfile.level}</p>
                    </div>
                  </div>

                  <div className="space-y-1 sm:space-y-2">
                    <h4 className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5 sm:gap-2">
                      <Info size={12} className="sm:w-3.5 sm:h-3.5" /> Description
                    </h4>
                    <p className="text-base sm:text-lg text-gray-700 leading-relaxed">
                      {selectedCoin.description}
                    </p>
                  </div>

                  {selectedCoin.summary && (
                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                      <h4 className="text-[10px] sm:text-xs font-bold text-amber-700 uppercase tracking-widest mb-1">Quick Summary</h4>
                      <p className="text-xs sm:text-sm text-amber-800 leading-relaxed italic">"{selectedCoin.summary}"</p>
                    </div>
                  )}

                  <button
                    onClick={(e) => {
                      toggleCollected(selectedCoin.id, e as any);
                      setSelectedCoin(null);
                    }}
                    className={`w-full py-3.5 sm:py-4 rounded-2xl text-lg sm:text-xl font-bold shadow-xl transition-all flex items-center justify-center gap-2 sm:gap-3 ${
                      collectedIds.includes(selectedCoin.id)
                        ? 'bg-gray-100 text-gray-600'
                        : 'bg-amber-500 text-white shadow-amber-200'
                    }`}
                  >
                    {collectedIds.includes(selectedCoin.id) ? (
                      <>
                        <CheckCircle2 size={20} className="sm:w-6 sm:h-6" /> Mark as Missing
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={20} className="sm:w-6 sm:h-6" /> Mark as Collected
                      </>
                    )}
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Purchased Coins Modal */}
      <AnimatePresence>
        {isPurchasedAddOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPurchasedAddOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
            >
              <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <Folder size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-gray-900 dark:text-white">Purchased Coins</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest">Collection History</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      setIsPurchased(true);
                      setIsManualAddOpen(true);
                    }}
                    className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors shadow-lg"
                    title="Add New Purchase"
                  >
                    <Plus size={20} />
                  </button>
                  <button 
                    onClick={() => setIsPurchasedAddOpen(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                  >
                    <X size={24} className="text-gray-400" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                {purchasedCoins.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                      <Folder size={40} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">No purchases logged</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Log your coin purchases when adding them manually.</p>
                  </div>
                ) : (
                  purchasedCoins.slice().reverse().map((p) => (
                    <div key={p.id} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-3xl border border-gray-100 dark:border-gray-700 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white dark:bg-gray-700 rounded-2xl flex items-center justify-center text-amber-500 font-bold text-xs border border-gray-100 dark:border-gray-600">
                          {p.denomination}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white leading-tight">{p.name}</p>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">{p.date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-amber-600 dark:text-amber-400">£{p.amountPaid.toFixed(2)}</p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase">Paid</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Photo Library Modal */}
      <AnimatePresence>
        {isPhotoLibraryOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPhotoLibraryOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col h-[85vh]"
            >
              <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center text-purple-600 dark:text-purple-400">
                    <Camera size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-gray-900 dark:text-white">Coin Photo Library</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest">Your Collection Gallery</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsPhotoLibraryOpen(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                >
                  <X size={24} className="text-gray-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                  {/* Show all coins that have custom images */}
                  {allCoins.filter(c => userCoinImages[c.id] || customCoins.some(cc => cc.id === c.id)).map((c) => (
                    <div 
                      key={c.id} 
                      onClick={() => {
                        setSelectedCoin(c);
                        setIsPhotoLibraryOpen(false);
                      }}
                      className="group relative aspect-square rounded-3xl overflow-hidden bg-gray-100 dark:bg-gray-800 border-2 border-transparent hover:border-amber-500 transition-all cursor-pointer shadow-sm"
                    >
                      <img 
                        src={c.imageUrl} 
                        alt={c.name} 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                        <p className="text-white font-bold text-xs truncate">{c.name}</p>
                        <p className="text-white/70 text-[10px]">{c.denomination}</p>
                      </div>
                    </div>
                  ))}
                  {allCoins.filter(c => userCoinImages[c.id] || customCoins.some(cc => cc.id === c.id)).length === 0 && (
                    <div className="col-span-full text-center py-20">
                      <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                        <Camera size={40} />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">No custom photos yet</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Add coins manually or change images to see them here.</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Data Conversion Modal */}
      <AnimatePresence>
        {isConverting && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-2xl p-6 sm:p-8 space-y-6"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-3xl flex items-center justify-center">
                  <RefreshCw size={40} className="animate-spin-slow" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white">Old Data Detected</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    We've detected data in an older format. Would you like to convert it to the new version?
                  </p>
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-2xl p-4 space-y-2">
                <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-widest">What happens:</p>
                <ul className="text-xs text-amber-600 dark:text-amber-500 space-y-1 list-disc ml-4">
                  <li>Automatic backup of current data will be created</li>
                  <li>Fields will be mapped to the new structure</li>
                  <li>All your coins, images, and spending will be preserved</li>
                  <li>Existing data will be merged/overwritten with the converted data</li>
                </ul>
              </div>

              {conversionError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400">
                  <AlertCircle size={18} />
                  <p className="text-xs font-bold">{conversionError}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => {
                    setIsConverting(false);
                    setConversionData(null);
                    setConversionError(null);
                  }}
                  className="py-4 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-bold rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all text-sm"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleApplyConversion(conversionData)}
                  className="py-4 bg-amber-500 text-white font-bold rounded-2xl hover:bg-amber-600 transition-all shadow-lg shadow-amber-100 dark:shadow-none text-sm"
                >
                  Convert Now
                </button>
              </div>
              
              <p className="text-[10px] text-center text-gray-400 uppercase font-bold tracking-widest">
                Safe & Offline Compatible
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Import Progress Overlay */}
      <AnimatePresence>
        {importProgress !== null && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-6">
            <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 text-center shadow-2xl">
              <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-3xl flex items-center justify-center mx-auto mb-6 text-amber-600 dark:text-amber-400">
                <RefreshCw size={40} className="animate-spin" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Importing Collection</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-8 font-medium">Please wait while we restore your data...</p>
              
              <div className="relative h-4 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-4">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${importProgress}%` }}
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-400 to-amber-600 shadow-lg"
                />
              </div>
              <p className="text-amber-600 dark:text-amber-400 font-black text-xl">{importProgress}%</p>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Web Search Modal */}
      <AnimatePresence>
        {isWebSearchOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsWebSearchOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]"
            >
              <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between bg-amber-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
                    <Globe size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Search Web Images</h3>
                    <p className="text-xs text-gray-500">Find the perfect photo for your coin</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsWebSearchOpen(false)}
                  className="p-2 hover:bg-amber-100 text-gray-400 hover:text-amber-600 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-4 sm:p-6 space-y-4 flex-1 overflow-y-auto">
                <div className="relative">
                  <input 
                    type="text"
                    value={webSearchQuery}
                    onChange={(e) => setWebSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && searchWebImages(webSearchQuery)}
                    placeholder="Search for coin images..."
                    className="w-full pl-10 pr-4 py-3 bg-gray-100 border-none rounded-2xl text-sm focus:ring-2 focus:ring-amber-500 transition-all"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <button 
                    onClick={() => searchWebImages(webSearchQuery)}
                    disabled={isSearchingWeb}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors disabled:opacity-50"
                  >
                    {isSearchingWeb ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                  </button>
                </div>

                {isSearchingWeb ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-4">
                    <Loader2 size={40} className="text-amber-500 animate-spin" />
                    <p className="text-sm text-gray-500 font-medium">Searching the web for images...</p>
                  </div>
                ) : webSearchResults.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {webSearchResults.map((url, idx) => (
                      <motion.div
                        key={idx}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => selectWebImage(url)}
                        className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 cursor-pointer group border-2 border-transparent hover:border-amber-500 transition-all"
                      >
                        <img 
                          src={url} 
                          alt={`Result ${idx}`}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.parentElement?.classList.add('hidden');
                          }}
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <Plus className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={24} />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 text-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search size={32} />
                    </div>
                    <p className="text-sm text-gray-500">No images found. Try a different search.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Manual Add Modal */}
      <AnimatePresence>
        {isManualAddOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsManualAddOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between bg-amber-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
                    <Plus size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Add Coin Manually</h3>
                    <p className="text-xs text-gray-500">Enter details for your custom find</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsManualAddOpen(false)}
                  className="p-2 hover:bg-amber-100 text-gray-400 hover:text-amber-600 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Coin Name</label>
                  <input 
                    type="text"
                    value={manualCoinName}
                    onChange={(e) => setManualCoinName(e.target.value)}
                    placeholder="e.g. Rare 50p Find"
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm focus:border-amber-500 focus:ring-0 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Denomination</label>
                    <select 
                      value={manualCoinDenom}
                      onChange={(e) => setManualCoinDenom(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm focus:border-amber-500 focus:ring-0 transition-all"
                    >
                      {['1p', '2p', '5p', '10p', '20p', '50p', '£1', '£2'].map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Year</label>
                    <input 
                      type="number"
                      value={manualCoinYear}
                      onChange={(e) => setManualCoinYear(parseInt(e.target.value))}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm focus:border-amber-500 focus:ring-0 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Summary (2 lines)</label>
                  <textarea 
                    value={manualCoinSummary}
                    onChange={(e) => setManualCoinSummary(e.target.value)}
                    placeholder="Brief description of the coin..."
                    rows={2}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm focus:border-amber-500 focus:ring-0 transition-all resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Est. Value (£)</label>
                    <input 
                      type="number"
                      step="0.01"
                      value={manualCoinValue}
                      onChange={(e) => setManualCoinValue(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm focus:border-amber-500 focus:ring-0 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Rarity</label>
                    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                    {['Common', 'Uncommon', 'Rare', 'Ultra Rare'].map(r => (
                      <button
                        key={r}
                        onClick={() => setManualCoinRarity(r)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                          manualCoinRarity === r 
                            ? 'bg-amber-500 text-white shadow-md scale-105' 
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Coin Photo</label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="relative aspect-video rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center cursor-pointer hover:border-amber-500 transition-all overflow-hidden"
                  >
                    {manualCoinPhoto ? (
                      <img src={manualCoinPhoto} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <Camera size={32} className="text-gray-300 mb-2" />
                        <p className="text-xs text-gray-400 font-medium">Tap to upload photo</p>
                      </>
                    )}
                    <input 
                      type="file"
                      ref={fileInputRef}
                      onChange={handleManualPhoto}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>
                </div>

                <button 
                  onClick={addManualCoin}
                  disabled={!manualCoinName.trim() || isAnalyzing}
                  className="w-full py-4 bg-amber-500 text-white font-bold rounded-2xl hover:bg-amber-600 transition-all shadow-lg shadow-amber-100 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isAnalyzing ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={20} />}
                  Add to Collection
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation Menu */}
      <AnimatePresence>
        {userProfile.settings?.showBottomMenu && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-gray-100 px-6 py-3 sm:py-4 flex items-center justify-around z-[90] pb-[calc(12px+var(--safe-bottom))]"
          >
            <button 
              onClick={() => {
                setActiveDenomination(null);
                setSearchQuery('');
              }}
              className={`flex flex-col items-center gap-1 transition-colors ${!activeDenomination ? 'text-amber-500' : 'text-gray-400'}`}
            >
              <Folder size={20} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Home</span>
            </button>
            <button 
              onClick={() => {
                if (isOffline) {
                  alert("Scanning requires an internet connection for AI analysis. Please try again when online.");
                  return;
                }
                setIsScanning(true);
              }}
              className={`w-12 h-12 bg-amber-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-amber-200 -mt-8 border-4 border-white ${isOffline ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
            >
              <Camera size={24} />
            </button>
            <button 
              onClick={() => setIsManualAddOpen(true)}
              className="flex flex-col items-center gap-1 text-gray-400 hover:text-amber-500 transition-colors"
            >
              <Plus size={20} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Add</span>
            </button>
            <button 
              onClick={() => setIsProfileOpen(true)}
              className={`flex flex-col items-center gap-1 transition-colors ${isProfileOpen ? 'text-amber-500' : 'text-gray-400'}`}
            >
              <User size={20} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Profile</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer / Safe Area Spacer for iOS */}
      <div className="h-4 sm:hidden" />
    </div>
  );
}
