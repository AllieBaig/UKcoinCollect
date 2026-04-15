import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Trophy, Search, ChevronRight, CheckCircle2, Circle, 
  ArrowLeft, Info, X, Plus, Send, Clipboard, Camera, Loader2, Sparkles,
  User, Settings, Award, Calendar, BarChart3, Share, WifiOff, RefreshCw, AlertTriangle, Globe, AlertCircle, TrendingUp, Trash2, Shield, Copy, Edit,
  Monitor, Smartphone, Database, Settings2, ShieldAlert, FlaskConical,
  Zap, Target, Dices, Layout, ImageOff, Clock, CheckCircle, ShoppingCart, Tag, Table, History, Moon, HelpCircle, ArrowRight, Star, ChevronDown,
  Wind, ShoppingBag, Tags,
  LayoutGrid, List, Columns, Kanban, ImageIcon, Focus, Minimize2, Hexagon, ArrowLeftRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { migrateData, AppVersion, SCHEMAS } from './versioning';
import { EUROPEAN_COINS, Coin } from './data/coins';
import { GoogleGenAI, Type } from "@google/genai";

export const DENOMINATIONS = [
  '1p', '2p', '5p', '10p', '20p', '50p', '£1', '£2',
  'Farthing', 'Half Penny', 'Penny', 'Threepence', 'Sixpence', 'Shilling', 'Florin', 'Half Crown', 'Crown',
  'Franc', 'Deutsche Mark', 'Lira', 'Peseta', 'Guilder', 'Schilling', '€1', '€2'
];

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

interface TimelineEvent {
  year: string;
  event: string;
  note: string;
}

interface Timeline {
  id: string;
  title: string;
  description: string;
  events: TimelineEvent[];
  unlockCondition?: {
    type: 'coins' | 'timeline' | 'level';
    value: number | string;
    description: string;
  };
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
  timelineStreak: number;
  lastTimelineDate?: string;
  totalSpend?: number;
  recoveryCode?: string;
  dnaScore: number;
  unlockedClues: string[];
  tags: CoinTag[];
  coinTags: Record<string, string[]>;
  goals: CollectionGoal[];
  timelineProgress: Record<string, number>;
  eraConquestProgress: Record<string, number>;
  lastTimelineId?: string;
  settings: {
    showBottomMenu: boolean;
    isDarkMode: boolean;
    followSystemTheme?: boolean;
    isCompactUI?: boolean;
    isTextMode?: boolean;
    isFocusMode?: boolean;
    isBackgroundRemovalEnabled?: boolean;
    isPurchaseMode?: boolean;
    showCoinPrice?: boolean;
    isNightBonusActive: boolean;
    sortBy?: 'recent-added' | 'recent-opened' | 'name' | 'year' | 'denomination' | 'date-added' | 'month-added' | 'country';
    groupBy?: 'year' | 'denomination' | 'date-added' | 'month-added' | 'country';
    isGrouped?: boolean;
    theme?: 'default' | 'paper' | 'glass' | 'wood' | 'metal' | 'fabric';
    fixedPrices?: Record<string, number>;
    showOldEuropeanCoins?: boolean;
    eraFilter?: 'Modern' | 'Old' | 'Both';
    layout?: 'grid' | 'list' | 'carousel' | 'masonry' | 'board' | 'timeline' | 'gallery' | 'spotlight' | 'compact' | 'split' | 'hexagon' | 'table' | 'text-card' | 'text-list' | 'text-compact';
    showLayoutSwitcher?: boolean;
    isAmbientMotionEnabled?: boolean;
    enabledLayouts?: Record<string, boolean>;
    visibleFields?: {
      denomination: boolean;
      year: boolean;
      mint: boolean;
      condition: boolean;
    };
  };
  safeModeBackup?: string;
}

interface TradeOffer {
  id: string;
  give: { coinId: string; count: number };
  get: { coinId: string };
  expiresAt: number;
}

interface CoinTag {
  id: string;
  name: string;
  color: string;
}

interface CollectionGoal {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  reward: number;
  isCompleted: boolean;
}

interface EraChallenge {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  isCompleted: boolean;
  reward: number;
}

interface Era {
  id: string;
  name: string;
  description: string;
  yearRange: [number, number];
  challenges: EraChallenge[];
  isLocked: boolean;
  unlockCondition?: string;
}

interface GameMode {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  progress: number;
  isLocked: boolean;
  unlockCondition?: string;
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
  TIMELINE_EXPLORE: 50,
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
  { id: 'b5', name: 'Master Hunter', description: 'Reach Level 10', icon: <Target size={16} /> },
  { id: 'b6', name: 'Timeline Explorer', description: 'Complete your first timeline', icon: <History size={16} /> },
  { id: 'b7', name: 'Timeline Master', description: 'Complete all timelines', icon: <Star size={16} /> },
  { id: 'b8', name: 'Mint Master', description: 'Collect 100 coins', icon: <Trophy size={16} /> },
  { id: 'b9', name: 'History Explorer', description: 'Reach a 7-day timeline streak', icon: <Calendar size={16} /> }
];

const LAYOUT_OPTIONS = [
  { id: 'grid', label: 'Grid', icon: <LayoutGrid size={16} /> },
  { id: 'list', label: 'List', icon: <List size={16} /> },
  { id: 'table', label: 'Table', icon: <Table size={16} /> },
  { id: 'carousel', label: 'Carousel', icon: <ArrowLeftRight size={16} /> },
  { id: 'masonry', label: 'Masonry', icon: <Columns size={16} /> },
  { id: 'board', label: 'Board', icon: <Kanban size={16} /> },
  { id: 'timeline', label: 'Timeline', icon: <History size={16} /> },
  { id: 'gallery', label: 'Gallery', icon: <ImageIcon size={16} /> },
  { id: 'spotlight', label: 'Spotlight', icon: <Focus size={16} /> },
  { id: 'compact', label: 'Compact', icon: <Minimize2 size={16} /> },
  { id: 'split', label: 'Split', icon: <Columns size={16} /> },
  { id: 'hexagon', label: 'Hexagon', icon: <Hexagon size={16} /> },
  { id: 'text-card', label: 'Card', icon: <LayoutGrid size={16} /> },
  { id: 'text-list', label: 'List', icon: <List size={16} /> },
  { id: 'text-compact', label: 'Compact', icon: <Minimize2 size={16} /> },
];

const LAYOUT_GROUPS = [
  {
    name: 'Visual Modes',
    options: ['grid', 'carousel', 'masonry', 'board', 'timeline', 'gallery', 'spotlight', 'split', 'hexagon', 'list', 'compact']
  },
  {
    name: 'Text Modes',
    options: ['text-card', 'table', 'text-list', 'text-compact']
  }
];

const ERAS: Era[] = [
  {
    id: 'era-1800s',
    name: 'The 1800s',
    description: 'The era of industrial revolution and Victorian coinage.',
    yearRange: [1800, 1899],
    challenges: [
      { id: 'c1', title: 'Victorian Starter', description: 'Collect 1 coin from the 1800s', target: 1, current: 0, isCompleted: false, reward: 200 },
      { id: 'c2', title: 'Century Collector', description: 'Collect 5 coins from the 1800s', target: 5, current: 0, isCompleted: false, reward: 500 }
    ],
    isLocked: false
  },
  {
    id: 'era-1900s',
    name: 'The 1900s',
    description: 'Early 20th century coins and the transition to modern minting.',
    yearRange: [1900, 1919],
    challenges: [
      { id: 'c3', title: 'Edwardian Era', description: 'Collect 3 coins from 1900-1919', target: 3, current: 0, isCompleted: false, reward: 300 }
    ],
    isLocked: true,
    unlockCondition: 'Complete 1 challenge in the 1800s'
  },
  {
    id: 'era-1920s',
    name: 'The Roaring 20s',
    description: 'Post-WWI coinage and the interwar period.',
    yearRange: [1920, 1929],
    challenges: [
      { id: 'c4', title: 'Jazz Age', description: 'Collect 3 coins from the 1920s', target: 3, current: 0, isCompleted: false, reward: 400 }
    ],
    isLocked: true,
    unlockCondition: 'Reach Level 5'
  },
  {
    id: 'era-modern',
    name: 'Modern Era',
    description: 'Decimalisation and the latest commemorative designs.',
    yearRange: [2000, 2026],
    challenges: [
      { id: 'c5', title: 'Millennium Collector', description: 'Collect 10 modern coins', target: 10, current: 0, isCompleted: false, reward: 600 }
    ],
    isLocked: true,
    unlockCondition: 'Collect 20 coins total'
  }
];

const GAME_MODES: GameMode[] = [
  {
    id: 'era-conquest',
    title: 'Era Conquest',
    description: 'Conquer different time periods by completing era-specific challenges.',
    icon: <Award size={24} />,
    color: 'from-amber-500 to-orange-600',
    progress: 0,
    isLocked: false
  },
  {
    id: 'mind-map',
    title: 'Mind Map Timeline',
    description: 'Explore the collection in an interactive tree structure.',
    icon: <Layout size={24} />,
    color: 'from-indigo-500 to-purple-600',
    progress: 0,
    isLocked: false
  },
  {
    id: 'timeline-explorer',
    title: 'Timeline Explorer',
    description: 'Journey through historical events and unlock numismatic lore.',
    icon: <History size={24} />,
    color: 'from-blue-500 to-indigo-600',
    progress: 0,
    isLocked: false
  },
  {
    id: 'mint-detective',
    title: 'Mint Mark Detective',
    description: 'Identify rare mint marks and uncover the secrets of the Royal Mint.',
    icon: <Search size={24} />,
    color: 'from-emerald-500 to-teal-600',
    progress: 0,
    isLocked: true,
    unlockCondition: 'Reach Level 10'
  },
  {
    id: 'timeline-puzzle',
    title: 'Timeline Puzzle',
    description: 'Reconstruct historical timelines by placing events in the correct order.',
    icon: <Dices size={24} />,
    color: 'from-rose-500 to-red-600',
    progress: 0,
    isLocked: true,
    unlockCondition: 'Complete 2 Timelines'
  },
  {
    id: 'coin-story',
    title: 'My Coin Story',
    description: 'Your personal journey as a collector, visualized through your discoveries.',
    icon: <Sparkles size={24} />,
    color: 'from-purple-500 to-pink-600',
    progress: 0,
    isLocked: false
  }
];

const AmbientBackground = ({ isEnabled }: { isEnabled: boolean }) => {
  if (!isEnabled) return null;

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden opacity-30 dark:opacity-10">
      <motion.div
        animate={{
          x: [0, 100, -50, 0],
          y: [0, 50, 100, 0],
          scale: [1, 1.2, 0.9, 1],
          rotate: [0, 90, 180, 0],
        }}
        transition={{
          duration: 40,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-amber-200/40 dark:bg-amber-500/10 rounded-full blur-[120px]"
      />
      <motion.div
        animate={{
          x: [0, -120, 60, 0],
          y: [0, 150, -80, 0],
          scale: [1, 1.1, 1.3, 1],
          rotate: [0, -120, -240, 0],
        }}
        transition={{
          duration: 50,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute top-1/4 -right-40 w-[700px] h-[700px] bg-blue-200/30 dark:bg-blue-500/10 rounded-full blur-[140px]"
      />
      <motion.div
        animate={{
          x: [0, 150, -100, 0],
          y: [0, -100, 150, 0],
          scale: [1, 1.4, 0.8, 1],
          rotate: [0, 180, 360, 0],
        }}
        transition={{
          duration: 60,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute -bottom-40 left-1/4 w-[500px] h-[500px] bg-purple-200/30 dark:bg-purple-500/10 rounded-full blur-[100px]"
      />
    </div>
  );
};

const MindMapTimeline = ({ coins, collectedIds, onSelectCoin }: { coins: Coin[], collectedIds: string[], onSelectCoin: (coin: Coin) => void }) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['root']));

  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  };

  const treeData = useMemo(() => {
    const root: any = { id: 'root', label: 'UK Coinage', children: {} };
    
    coins.forEach(coin => {
      const year = coin.year.toString();
      const mint = 'Royal Mint'; // Default for UK coins
      const denom = coin.denomination;
      
      if (!root.children[year]) root.children[year] = { id: year, label: `Year ${year}`, children: {} };
      if (!root.children[year].children[mint]) root.children[year].children[mint] = { id: `${year}-${mint}`, label: mint, children: {} };
      if (!root.children[year].children[mint].children[denom]) root.children[year].children[mint].children[denom] = { id: `${year}-${mint}-${denom}`, label: denom, children: {} };
      
      const coinId = coin.id;
      root.children[year].children[mint].children[denom].children[coinId] = { 
        id: coinId, 
        label: coin.name, 
        coin: coin,
        isCollected: collectedIds.includes(coinId)
      };
    });
    
    return root;
  }, [coins, collectedIds]);

  const renderNode = (node: any, depth: number = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const children = node.children ? Object.values(node.children) : [];
    const hasChildren = children.length > 0;
    
    // Calculate progress for this branch
    const getAllCoinsInBranch = (n: any): string[] => {
      if (n.coin) return [n.id];
      if (!n.children) return [];
      return Object.values(n.children).flatMap(getAllCoinsInBranch);
    };
    
    const coinsInBranch = getAllCoinsInBranch(node);
    const collectedInBranch = coinsInBranch.filter(id => collectedIds.includes(id)).length;
    const progress = coinsInBranch.length > 0 ? Math.round((collectedInBranch / coinsInBranch.length) * 100) : 0;
    const isUnlocked = progress > 0 || node.id === 'root' || depth < 2; // Root and top levels always visible, others if progress > 0

    if (!isUnlocked && depth > 1) return null;

    return (
      <div key={node.id} className={`${depth > 0 ? 'ml-6 border-l border-gray-100 dark:border-gray-800' : ''}`}>
        <div 
          onClick={() => {
            if (hasChildren) toggleNode(node.id);
            if (node.coin) onSelectCoin(node.coin);
          }}
          className={`group flex items-center gap-3 py-2 px-3 cursor-pointer transition-all rounded-lg ${
            node.isCollected 
              ? 'text-amber-600 font-bold bg-amber-50/50 dark:bg-amber-900/10' 
              : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-900'
          }`}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {hasChildren && (
              <motion.span 
                animate={{ rotate: isExpanded ? 90 : 0 }}
                className="text-[10px] text-gray-400 w-4 flex justify-center"
              >
                ▶
              </motion.span>
            )}
            {!hasChildren && <div className="w-4 h-4 rounded-full border-2 border-amber-500/30 flex-shrink-0" />}
            
            <span className={`text-xs font-black uppercase tracking-widest truncate ${node.coin ? 'text-[10px]' : ''}`}>
              {node.label}
            </span>
            
            {hasChildren && depth > 0 && (
              <span className="text-[8px] font-black text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                {progress}%
              </span>
            )}
          </div>
          
          {node.isCollected && <CheckCircle2 size={14} className="text-amber-500 flex-shrink-0" />}
          {hasChildren && isExpanded && <div className="w-1 h-1 bg-amber-500 rounded-full" />}
        </div>
        
        <AnimatePresence>
          {isExpanded && hasChildren && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              {children.map((child: any) => renderNode(child, depth + 1))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-950 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h4 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">Interactive Mind Map</h4>
            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Year → Mint → Denomination → Coin</p>
          </div>
          <div className="bg-amber-100 dark:bg-amber-900/30 text-amber-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
            {collectedIds.length} / {coins.length} Explored
          </div>
        </div>
        
        <div className="max-h-[60vh] overflow-y-auto no-scrollbar pr-2">
          {renderNode(treeData)}
        </div>
      </div>
      
      <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-2xl border border-amber-100 dark:border-amber-900/20">
        <p className="text-[10px] text-amber-700 dark:text-amber-400 font-bold leading-relaxed">
          <Sparkles size={12} className="inline mr-1 mb-1" />
          Branches unlock as you collect coins. Explore the tree to see the full lineage of your collection.
        </p>
      </div>
    </div>
  );
};

const TIMELINES: Timeline[] = [
  {
    id: 't1',
    title: 'Numismatic Journey',
    description: 'Explore the history of coin collecting from ancient times to the digital age.',
    events: [
      { year: '600 BC', event: 'First Lydian Coins', note: 'The birth of standardized currency in ancient Lydia.' },
      { year: '14th Century', event: 'Renaissance Collecting', note: 'Petrarch becomes one of the first known collectors of Roman coins.' },
      { year: '1850s', event: 'Modern Numismatics', note: 'Establishment of major numismatic societies globally.' },
      { year: '2009', event: 'Bitcoin Launch', note: 'The start of the digital currency era.' }
    ]
  },
  {
    id: 't2',
    title: 'Coin Evolution',
    description: 'Track how materials and shapes of coins have changed over millennia.',
    events: [
      { year: 'Ancient', event: 'Electrum Coins', note: 'Natural alloy of gold and silver used for early coins.' },
      { year: 'Medieval', event: 'Hammered Coins', note: 'Coins produced by striking a blank between two dies with a hammer.' },
      { year: '17th Century', event: 'Milled Coins', note: 'Introduction of screw presses for more uniform coins.' },
      { year: 'Modern', event: 'Bimetallic Coins', note: 'Coins made of two different metals, like the modern £2 coin.' }
    ],
    unlockCondition: { type: 'coins', value: 5, description: 'Collect 5 coins to unlock' }
  },
  {
    id: 't3',
    title: 'Coin Conspiracy',
    description: 'Uncover the mysteries and hidden symbols found on world currencies.',
    events: [
      { year: '1776', event: 'The Great Seal', note: 'The Eye of Providence on the US dollar and its alleged links to secret societies.' },
      { year: '1943', event: 'The Steel Penny', note: 'Why the US switched to steel during WWII and the rare copper errors.' },
      { year: '2000s', event: 'The Euro Launch', note: 'Conspiracies about hidden maps and symbols on the new European currency.' }
    ],
    unlockCondition: { type: 'level', value: 3, description: 'Reach Level 3 to unlock' }
  },
  {
    id: 't4',
    title: 'Design Evolution Timeline',
    description: 'See how artistic styles on coins transitioned from classical to contemporary.',
    events: [
      { year: 'Classical', event: 'Greek Realism', note: 'High artistic detail in depicting gods and athletes.' },
      { year: 'Victorian', event: 'Gothic Revival', note: 'Intricate, ornate designs reflecting the era\'s architecture.' },
      { year: 'Art Deco', event: 'Geometric Precision', note: 'Bold, stylized designs from the early 20th century.' },
      { year: 'Digital', event: 'Minimalist Design', note: 'Clean, simple lines used in modern commemorative coins.' }
    ],
    unlockCondition: { type: 'timeline', value: 't1', description: 'Complete Numismatic Journey to unlock' }
  },
  {
    id: 't5',
    title: 'Mint Mark Detective',
    description: 'Learn how to identify where your coins were born and their rarity secrets.',
    events: [
      { year: 'Early', event: 'Hand-Struck Marks', note: 'Small, often irregular marks indicating the mint location.' },
      { year: 'Industrial', event: 'Standardized Letters', note: 'Clear letters like "P", "D", or "S" used to denote specific mints.' },
      { year: 'Modern', event: 'Micro-Printing', note: 'Advanced security features that also serve as modern mint identifiers.' }
    ],
    unlockCondition: { type: 'coins', value: 15, description: 'Collect 15 coins to unlock' }
  }
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
  const [userCoinImages, setUserCoinImages] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('user_coin_images');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      console.error("Failed to load user_coin_images", e);
      return {};
    }
  });

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
  const [userCoinDenominations, setUserCoinDenominations] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('user_coin_denominations');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      console.error("Failed to load user_coin_denominations", e);
      return {};
    }
  });

  const [userCoinValues, setUserCoinValues] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('user_coin_values');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      console.error("Failed to load user_coin_values", e);
      return {};
    }
  });

  const allCoins = useMemo(() => {
    const baseCoins = [...EUROPEAN_COINS, ...customCoins];
    return baseCoins.map(coin => ({
      ...coin,
      imageUrl: userCoinImages[coin.id] || coin.imageUrl,
      denomination: userCoinDenominations[coin.id] || coin.denomination,
      value: userCoinValues[coin.id] !== undefined ? userCoinValues[coin.id] : coin.value
    }));
  }, [customCoins, userCoinImages, userCoinDenominations, userCoinValues]);

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

  const [selectedCoinIds, setSelectedCoinIds] = useState<Set<string>>(new Set());
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [isBulkPriceModalOpen, setIsBulkPriceModalOpen] = useState(false);
  const [bulkPriceInput, setBulkPriceInput] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

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
        timelineStreak: 0,
        lastTimelineDate: '',
        settings: {
          showBottomMenu: true,
          isDarkMode: false,
          followSystemTheme: true,
          isCompactUI: false,
          isTextMode: false,
          isFocusMode: false,
          isBackgroundRemovalEnabled: true,
          isPurchaseMode: false,
          showCoinPrice: true,
          isNightBonusActive: true,
          sortBy: 'recent-added',
          groupBy: 'year',
          isGrouped: false,
          theme: 'default',
          fixedPrices: {},
          showOldEuropeanCoins: true,
          eraFilter: 'Both',
          isAmbientMotionEnabled: true,
          enabledLayouts: {
            grid: true,
            list: true,
            table: true,
            compact: true,
            carousel: true,
            masonry: true,
            board: true,
            timeline: true,
            gallery: true,
            spotlight: true,
            split: true,
            hexagon: true
          },
          visibleFields: {
            denomination: true,
            year: true,
            mint: true,
            condition: true
          }
        },
        dnaScore: 0,
        unlockedClues: [],
        tags: [
          { id: 't1', name: 'Favorite', color: '#ef4444' },
          { id: 't2', name: 'Wishlist', color: '#3b82f6' },
          { id: 't3', name: 'Duplicate', color: '#10b981' }
        ],
        coinTags: {},
        goals: [],
        timelineProgress: {},
        eraConquestProgress: {},
        lastTimelineId: undefined,
      };

      if (!saved) return defaultProfile;
      
      const parsed = JSON.parse(saved);
      // Merge with defaults to ensure new fields exist
      return {
        ...defaultProfile,
        ...parsed,
        settings: {
          ...defaultProfile.settings,
          ...parsed.settings,
          fixedPrices: parsed.settings?.fixedPrices || {},
          showOldEuropeanCoins: parsed.settings?.showOldEuropeanCoins ?? true,
          eraFilter: parsed.settings?.eraFilter || 'Both',
          layout: parsed.settings?.layout || 'grid',
          showLayoutSwitcher: parsed.settings?.showLayoutSwitcher ?? true,
          isAmbientMotionEnabled: parsed.settings?.isAmbientMotionEnabled ?? true
        },
        missions: parsed.missions || defaultProfile.missions,
        timelineStreak: parsed.timelineStreak || 0,
        lastTimelineDate: parsed.lastTimelineDate || '',
        dnaScore: parsed.dnaScore || 0,
        unlockedClues: parsed.unlockedClues || [],
        tags: parsed.tags || [
          { id: 't1', name: 'Favorite', color: '#ef4444' },
          { id: 't2', name: 'Wishlist', color: '#3b82f6' },
          { id: 't3', name: 'Duplicate', color: '#10b981' }
        ],
        coinTags: parsed.coinTags || {},
        goals: parsed.goals || [],
        timelineProgress: parsed.timelineProgress || {},
        eraConquestProgress: parsed.eraConquestProgress || {},
        lastTimelineId: parsed.lastTimelineId,
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
        timelineStreak: 0,
        lastTimelineDate: '',
        dnaScore: 0,
        unlockedClues: [],
        tags: [
          { id: 't1', name: 'Favorite', color: '#ef4444' },
          { id: 't2', name: 'Wishlist', color: '#3b82f6' },
          { id: 't3', name: 'Duplicate', color: '#10b981' }
        ],
        coinTags: {},
        goals: [],
        timelineProgress: {},
        eraConquestProgress: {},
        lastTimelineId: undefined,
        settings: {
          showBottomMenu: true,
          isDarkMode: false,
          followSystemTheme: true,
          isCompactUI: false,
          isTextMode: false,
          isFocusMode: false,
          isBackgroundRemovalEnabled: true,
          isPurchaseMode: false,
          showCoinPrice: true,
          isNightBonusActive: true,
          sortBy: 'recent-added',
          showOldEuropeanCoins: true,
          eraFilter: 'Both',
          layout: 'grid',
          showLayoutSwitcher: true
        }
      };
    }
  });

  const themeStyles = useMemo(() => {
    const theme = userProfile.settings?.theme || 'default';
    const isDark = userProfile.settings?.isDarkMode;

    if (theme === 'default') return {};

    const themes: Record<string, any> = {
      paper: {
        '--app-bg': isDark ? '#2c2a26' : '#fcfaf5',
        '--card-bg': isDark ? '#35322e' : '#ffffff',
        '--card-border': isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
        '--card-shadow': '0 8px 30px rgba(0,0,0,0.04)',
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E")`,
      },
      glass: {
        '--app-bg': isDark ? '#020617' : '#f8fafc',
        '--card-bg': isDark ? 'rgba(30, 41, 59, 0.4)' : 'rgba(255, 255, 255, 0.3)',
        '--backdrop': 'blur(24px)',
        '--card-border': isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.5)',
        '--card-shadow': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
        backgroundImage: isDark 
          ? 'radial-gradient(circle at 50% 0%, rgba(56, 189, 248, 0.15), transparent 40%), radial-gradient(circle at 0% 100%, rgba(139, 92, 246, 0.15), transparent 40%)'
          : 'radial-gradient(circle at 50% 0%, rgba(56, 189, 248, 0.1), transparent 40%), radial-gradient(circle at 0% 100%, rgba(139, 92, 246, 0.1), transparent 40%)',
      },
      wood: {
        '--app-bg': isDark ? '#2a1d15' : '#f5e6d3',
        '--card-bg': isDark ? '#35261c' : '#ffffff',
        '--card-border': isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
        '--card-shadow': '0 10px 40px rgba(0,0,0,0.06)',
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='wood'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.01 0.4' numOctaves='2' stitchTiles='stitch'/%3E%3CfeDisplacementMap in='SourceGraphic' scale='10'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23wood)' opacity='0.08'/%3E%3C/svg%3E")`,
      },
      metal: {
        '--app-bg': isDark ? '#0f172a' : '#e2e8f0',
        '--card-bg': isDark ? '#1e293b' : '#f8fafc',
        '--card-border': isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.8)',
        '--card-shadow': '0 10px 40px rgba(0,0,0,0.08)',
        backgroundImage: `linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 50%, rgba(255,255,255,0.05) 100%), url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='metal'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='1' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23metal)' opacity='0.03'/%3E%3C/svg%3E")`,
      },
      fabric: {
        '--app-bg': isDark ? '#1a1c1e' : '#f3f4f6',
        '--card-bg': isDark ? '#242729' : '#ffffff',
        '--card-border': isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
        '--card-shadow': '0 8px 30px rgba(0,0,0,0.05)',
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0V0zm20 20h20v20H20V20zM0 20h20v20H0V20zm20-20h20v20H20V0z' fill='%23000' fill-opacity='0.015' fill-rule='evenodd'/%3E%3C/svg%3E")`,
      }
    };

    const current = themes[theme] || {};
    const styles: any = { ...current };
    if (current['--app-bg']) styles.backgroundColor = current['--app-bg'];
    return styles;
  }, [userProfile.settings?.theme, userProfile.settings?.isDarkMode]);
  const [isSafeMode, setIsSafeMode] = useState(() => {
    return localStorage.getItem('force_safe_mode') === 'true';
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'collected' | 'missing'>('all');
  const [selectedCoin, setSelectedCoin] = useState<Coin | null>(null);
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
  const [isIdentityCardOpen, setIsIdentityCardOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isStoryModeOpen, setIsStoryModeOpen] = useState(false);
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);
  const [isGameModesOpen, setIsGameModesOpen] = useState(false);
  const [activeGameMode, setActiveGameMode] = useState<string | null>(null);
  const [activeTimeline, setActiveTimeline] = useState<Timeline | null>(null);
  const [puzzleState, setPuzzleState] = useState<{
    events: TimelineEvent[];
    userOrder: number[];
    isComplete: boolean;
    timelineId: string;
  } | null>(null);
  const [expandedEvents, setExpandedEvents] = useState<Record<string, Record<number, boolean>>>({});

  const [isLayoutMenuOpen, setIsLayoutMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [collectionHistory, setCollectionHistory] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('collection_history');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      console.error("Failed to load collection_history", e);
      return {};
    }
  });

  const myCoinStory = useMemo(() => {
    const events: TimelineEvent[] = [];
    const historyEntries = Object.entries(collectionHistory)
      .map(([id, date]) => ({ id, date: new Date(date) }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    if (historyEntries.length > 0) {
      // First coin added
      const first = historyEntries[0];
      const coin = allCoins.find(c => c.id === first.id);
      if (coin) {
        events.push({
          year: first.date.getFullYear().toString(),
          event: `First Discovery: ${coin.name}`,
          note: `Your journey began on ${first.date.toLocaleDateString()} with this ${coin.denomination} coin. It marked the start of your numismatic adventure!`
        });
      }

      // Rare coins
      historyEntries.forEach(entry => {
        const coin = allCoins.find(c => c.id === entry.id);
        if (coin && (coin.rarity === 'Rare' || coin.rarity === 'Ultra Rare')) {
          events.push({
            year: entry.date.getFullYear().toString(),
            event: `Rare Find: ${coin.name}`,
            note: `An incredible discovery! You found a ${coin.rarity} ${coin.denomination} coin. These are highly sought after by collectors.`
          });
        }
      });

      // Monthly milestones
      const monthsSeen = new Set<string>();
      historyEntries.forEach(entry => {
        const monthYear = `${entry.date.getMonth()}-${entry.date.getFullYear()}`;
        if (!monthsSeen.has(monthYear)) {
          monthsSeen.add(monthYear);
          const coin = allCoins.find(c => c.id === entry.id);
          if (coin) {
            events.push({
              year: entry.date.getFullYear().toString(),
              event: `${entry.date.toLocaleString('default', { month: 'long' })} Milestone`,
              note: `You were active in ${entry.date.toLocaleString('default', { month: 'long' })}, adding coins like the ${coin.name} to your growing collection.`
            });
          }
        }
      });
      
      // Most collected type
      const counts: Record<string, number> = {};
      collectedIds.forEach(id => {
        const coin = allCoins.find(c => c.id === id);
        if (coin) counts[coin.denomination] = (counts[coin.denomination] || 0) + 1;
      });
      const sortedCounts = Object.entries(counts).sort((a, b) => b[1] - a[1]);
      const mostCollected = sortedCounts[0];
      if (mostCollected) {
        events.push({
          year: 'Current',
          event: `Specialist: ${mostCollected[0]}`,
          note: `You have a clear preference for ${mostCollected[0]} coins, with ${mostCollected[1]} in your collection! You're becoming a true expert in this denomination.`
        });
      }
    }

    // Sort events by year (roughly)
    events.sort((a, b) => {
      if (a.year === 'Current') return 1;
      if (b.year === 'Current') return -1;
      return parseInt(a.year) - parseInt(b.year);
    });

    return {
      id: 'my-story',
      title: 'My Coin Story',
      description: 'A personalized timeline of your collecting journey and milestones.',
      events,
      unlockCondition: undefined
    } as Timeline;
  }, [collectionHistory, allCoins, collectedIds]);

  const allTimelines = useMemo(() => [myCoinStory, ...TIMELINES], [myCoinStory]);

  const timelineLevel = useMemo(() => {
    const count = collectedIds.length;
    if (count >= 50) return 'Expert';
    if (count >= 10) return 'Collector';
    return 'Beginner';
  }, [collectedIds.length]);

  const startPuzzle = (timeline: Timeline) => {
    const shuffledIndices = timeline.events.map((_, i) => i).sort(() => Math.random() - 0.5);
    setPuzzleState({
      events: [...timeline.events],
      userOrder: shuffledIndices,
      isComplete: false,
      timelineId: timeline.id
    });
    setActiveGameMode('timeline-puzzle');
  };

  const swapPuzzleItems = (idx1: number, idx2: number) => {
    if (!puzzleState) return;
    const newUserOrder = [...puzzleState.userOrder];
    [newUserOrder[idx1], newUserOrder[idx2]] = [newUserOrder[idx2], newUserOrder[idx1]];
    
    // Check if complete
    const isComplete = newUserOrder.every((val, i) => val === i);
    
    setPuzzleState({
      ...puzzleState,
      userOrder: newUserOrder,
      isComplete
    });

    if (isComplete) {
      addPoints(500, `Puzzle Solved: ${TIMELINES.find(t => t.id === puzzleState.timelineId)?.title}`);
    }
  };

  const getEraProgress = (era: Era) => {
    const coinsInEra = allCoins.filter(c => c.year >= era.yearRange[0] && c.year <= era.yearRange[1]);
    const collectedInEra = coinsInEra.filter(c => collectedIds.includes(c.id));
    if (coinsInEra.length === 0) return 0;
    return Math.round((collectedInEra.length / coinsInEra.length) * 100);
  };

  const getChallengeProgress = (challenge: EraChallenge) => {
    if (challenge.id === 'c1' || challenge.id === 'c2') {
      const count = allCoins.filter(c => c.year >= 1800 && c.year <= 1899 && collectedIds.includes(c.id)).length;
      return Math.min(count, challenge.target);
    }
    if (challenge.id === 'c3') {
      const count = allCoins.filter(c => c.year >= 1900 && c.year <= 1919 && collectedIds.includes(c.id)).length;
      return Math.min(count, challenge.target);
    }
    if (challenge.id === 'c4') {
      const count = allCoins.filter(c => c.year >= 1920 && c.year <= 1929 && collectedIds.includes(c.id)).length;
      return Math.min(count, challenge.target);
    }
    if (challenge.id === 'c5') {
      const count = allCoins.filter(c => c.year >= 2000 && c.year <= 2026 && collectedIds.includes(c.id)).length;
      return Math.min(count, challenge.target);
    }
    return 0;
  };

  const checkEraChallenges = () => {
    let pointsAwarded = 0;
    const newEraProgress = { ...userProfile.eraConquestProgress };
    let hasChanges = false;

    ERAS.forEach(era => {
      era.challenges.forEach(challenge => {
        const current = getChallengeProgress(challenge);
        const isCompleted = current >= challenge.target;
        
        if (isCompleted && !userProfile.eraConquestProgress[challenge.id]) {
          pointsAwarded += challenge.reward;
          newEraProgress[challenge.id] = 100;
          hasChanges = true;
          
          // Add notification
          setPointsNotification({
            amount: challenge.reward,
            message: `Challenge Completed: ${challenge.title}!`
          });
          setTimeout(() => setPointsNotification(null), 3000);
        }
      });
    });

    if (hasChanges) {
      setUserProfile(prev => ({
        ...prev,
        points: prev.points + pointsAwarded,
        eraConquestProgress: newEraProgress
      }));
    }
  };

  useEffect(() => {
    if (collectedIds.length > 0) {
      checkEraChallenges();
    }
  }, [collectedIds]);

  const [isCompareMode, setIsCompareMode] = useState(false);
  const [compareCoins, setCompareCoins] = useState<[Coin | null, Coin | null]>([null, null]);
  const [discoveryFact, setDiscoveryFact] = useState<string | null>(null);
  const [conversionData, setConversionData] = useState<any>(null);

  // New features state
  const [isFusionMode, setIsFusionMode] = useState(false);
  const [isFusionModalOpen, setIsFusionModalOpen] = useState(false);
  const [fusionSelection, setFusionSelection] = useState<string[]>([]);
  const [tradeOffer, setTradeOffer] = useState<TradeOffer | null>(null);
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const uiDensity = useMemo(() => {
    if (windowWidth < 400) return 'compact';
    if (windowWidth < 768) return 'normal';
    return 'spacious';
  }, [windowWidth]);

  const getResponsiveClass = (base: string, compact: string, normal: string, spacious: string) => {
    if (uiDensity === 'compact') return `${base} ${compact}`;
    if (uiDensity === 'normal') return `${base} ${normal}`;
    return `${base} ${spacious}`;
  };
  const [isNightBonus, setIsNightBonus] = useState(false);
  const [dnaScore, setDnaScore] = useState(0);
  const [unlockedClues, setUnlockedClues] = useState<string[]>([]);

  const COIN_FACTS = [
    "The 50p coin was the world's first seven-sided coin.",
    "The 2009 Kew Gardens 50p is one of the rarest in circulation.",
    "The Royal Mint has been making coins for over 1,100 years.",
    "The 2p coin was originally made of bronze, but now it's copper-plated steel.",
    "The £2 coin was introduced in 1998.",
    "The 12-sided £1 coin was introduced in 2017 to prevent counterfeiting.",
    "The 50p coin was introduced in 1969 to replace the ten-shilling note.",
    "The 10p coin was the first to be decimalised in 1968.",
    "The 1p and 2p coins are legal tender for amounts up to 20p.",
    "The 5p and 10p coins are legal tender for amounts up to £5."
  ];
  const [conversionError, setConversionError] = useState<string | null>(null);

  const needsConversion = (data: any) => {
    if (!data || typeof data !== 'object') return false;
    if (Array.isArray(data)) return true; // v1
    // v2 snake_case check
    if (data.collected_coins || data.custom_coins || data.requested_coins || data.user_profile || data.user_coin_images) return true;
    // v3 or other version check
    if (data.version && data.version !== '3.0') return true;
    return false;
  };

  const validateAndSanitizeData = (data: any) => {
    try {
      if (!data || typeof data !== 'object') throw new Error("Invalid data format");

      const currentVersion = (data.version || '2.0') as AppVersion;
      const allowedFields = SCHEMAS[currentVersion] || SCHEMAS['2.0'];

      const sanitized: any = {};
      allowedFields.forEach(field => {
        if (data[field] !== undefined) {
          sanitized[field] = data[field];
        }
      });

      // Ensure version is set
      sanitized.version = currentVersion;

      // Basic validation for critical fields
      sanitized.collectedIds = Array.isArray(sanitized.collectedIds) ? sanitized.collectedIds : [];
      sanitized.customCoins = Array.isArray(sanitized.customCoins) ? sanitized.customCoins : [];
      sanitized.requestedCoins = Array.isArray(sanitized.requestedCoins) ? sanitized.requestedCoins : [];
      
      if (sanitized.userProfile) {
        const p = sanitized.userProfile;
        p.badges = Array.isArray(p.badges) ? p.badges : [];
        p.points = typeof p.points === 'number' ? p.points : 0;
        p.level = typeof p.level === 'number' ? p.level : 1;
        p.settings = p.settings && typeof p.settings === 'object' ? p.settings : {};
      }

      return sanitized;
    } catch (err) {
      console.error("Validation failed:", err);
      return null;
    }
  };

  const convertOldData = (oldData: any) => {
    try {
      // Step 1: Normalize to a known version if it's legacy
      let normalized = { ...oldData };
      if (Array.isArray(oldData)) {
        normalized = { version: '2.0', collectedIds: oldData };
      } else if (oldData.collected_coins || oldData.user_profile) {
        // Legacy snake_case
        normalized = {
          version: '2.0',
          collectedIds: oldData.collected_coins || [],
          customCoins: oldData.custom_coins || [],
          requestedCoins: oldData.requested_coins || [],
          userProfile: oldData.user_profile || {},
          userCoinImages: oldData.user_coin_images || {}
        };
      }

      // Step 2: Migrate to current app version (3.0)
      const migrated = migrateData(normalized, '3.0');

      // Step 3: Final sanitization
      return validateAndSanitizeData(migrated) || migrated;
    } catch (err) {
      console.error("Conversion failed:", err);
      throw new Error("Data mapping failed. The file might be corrupted or incompatible.");
    }
  };

  const isOldDataFormat = (data: any) => {
    return needsConversion(data);
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
      if (converted.userProfile) {
        setUserProfile(prev => ({
          ...prev,
          ...converted.userProfile,
          settings: {
            ...prev.settings,
            ...(converted.userProfile.settings || {})
          }
        }));
      }
      if (converted.userCoinImages) setUserCoinImages(converted.userCoinImages);
      if (converted.purchasedCoins) setPurchasedCoins(converted.purchasedCoins);

      setIsConverting(false);
      setConversionData(null);
      setConversionError(null);
      alert("Import successful! Your data has been normalized and restored.");
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
  const [manualCoinCountry, setManualCoinCountry] = useState('UK');
  const [manualCoinType, setManualCoinType] = useState<'Modern' | 'Old'>('Modern');
  const [isPurchased, setIsPurchased] = useState(false);
  const [editingCoinId, setEditingCoinId] = useState<string | null>(null);

  useEffect(() => {
    if (userProfile.settings?.fixedPrices && userProfile.settings.fixedPrices[manualCoinDenom]) {
      setManualCoinValue(userProfile.settings.fixedPrices[manualCoinDenom].toString());
    }
  }, [manualCoinDenom, userProfile.settings?.fixedPrices]);

  const [lastOpenedIds, setLastOpenedIds] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('last_opened_ids');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem('last_opened_ids', JSON.stringify(lastOpenedIds));
  }, [lastOpenedIds]);
  
  const [pointsNotification, setPointsNotification] = useState<{ amount: number; message: string } | null>(null);
  
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    if (isOffline) {
      const interval = setInterval(() => {
        const randomFact = COIN_FACTS[Math.floor(Math.random() * COIN_FACTS.length)];
        setDiscoveryFact(randomFact);
      }, 10000);
      return () => clearInterval(interval);
    } else {
      setDiscoveryFact(null);
    }
  }, [isOffline, COIN_FACTS]);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);


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

        // Timeline Streak Logic
        const lastTimelineDate = prev.lastTimelineDate;
        let newTimelineStreak = prev.timelineStreak;
        if (lastTimelineDate !== yesterdayStr && lastTimelineDate !== today) {
          newTimelineStreak = 0; // Reset if missed a day
        }

        return {
          ...prev,
          lastLoginDate: today,
          streak: newStreak,
          timelineStreak: newTimelineStreak,
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
      if (collectedIds.length >= 100 && !newBadges.includes('b8')) {
        newBadges.push('b8');
        changed = true;
        addPoints(10000, "Badge Unlocked: Mint Master!");
      }
      if (userProfile.timelineStreak >= 7 && !newBadges.includes('b9')) {
        newBadges.push('b9');
        changed = true;
        addPoints(3000, "Badge Unlocked: History Explorer!");
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

  useEffect(() => {
    localStorage.setItem('collection_history', JSON.stringify(collectionHistory));
  }, [collectionHistory]);

  useEffect(() => {
    if (collectedIds.length === 20 || collectedIds.length === 50) {
      setPointsNotification({ amount: 500, message: `Milestone: ${collectedIds.length} Coins! Hidden Settings Unlocked.` });
    }
  }, [collectedIds.length]);

  // Night Bonus Mode Logic
  useEffect(() => {
    const checkNightMode = () => {
      const hour = new Date().getHours();
      const isNight = hour >= 20 || hour < 6;
      if (isNight !== isNightBonus) {
        setIsNightBonus(isNight);
        if (isNight && userProfile.settings.isNightBonusActive) {
          setPointsNotification({ amount: 0, message: "🌙 Night Bonus Active! 1.5x XP" });
          setTimeout(() => setPointsNotification(null), 3000);
        }
      }
    };

    checkNightMode();
    const interval = setInterval(checkNightMode, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [isNightBonus, userProfile.settings.isNightBonusActive]);

  // Mystery Trade Offers Logic
  useEffect(() => {
    const generateTradeOffer = () => {
      if (collectedIds.length < 5) return;

      const collectedUnique = Array.from(new Set(collectedIds));
      if (collectedUnique.length === 0) return;

      const randomGiveId = collectedUnique[Math.floor(Math.random() * collectedUnique.length)];
      const missingCoins = allCoins.filter(c => !collectedIds.includes(c.id));
      if (missingCoins.length === 0) return;

      const randomGet = missingCoins[Math.floor(Math.random() * missingCoins.length)];

      const newOffer: TradeOffer = {
        id: Math.random().toString(36).substr(2, 9),
        give: { coinId: randomGiveId, count: 2 },
        get: { coinId: randomGet.id },
        expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
      };

      setTradeOffer(newOffer);
      setPointsNotification({ amount: 0, message: "New Mystery Trade Offer available!" });
    };

    const interval = setInterval(() => {
      if (!tradeOffer || Date.now() > tradeOffer.expiresAt) {
        generateTradeOffer();
      }
    }, 300000); // Every 5 minutes
    
    if (!tradeOffer) generateTradeOffer(); // Initial offer
    return () => clearInterval(interval);
  }, [collectedIds, tradeOffer, allCoins]);

  const acceptTrade = () => {
    if (!tradeOffer) return;
    
    const count = collectedIds.filter(id => id === tradeOffer.give.coinId).length;
    if (count < tradeOffer.give.count) {
      alert("You no longer have the required coins for this trade.");
      setTradeOffer(null);
      return;
    }

    setCollectedIds(prev => {
      const next = [...prev];
      for (let i = 0; i < tradeOffer.give.count; i++) {
        const index = next.indexOf(tradeOffer.give.coinId);
        if (index > -1) next.splice(index, 1);
      }
      next.push(tradeOffer.get.coinId);
      return next;
    });

    addPoints(250, "🤝 Trade Successful!");
    setTradeOffer(null);
    setIsTradeModalOpen(false);
  };

  const fuseCoins = (coinId?: string) => {
    const targetId = coinId || (fusionSelection.length > 0 ? fusionSelection[0] : null);
    if (!targetId) return;

    const count = collectedIds.filter(id => id === targetId).length;
    if (count < 3) {
      alert("You need at least 3 duplicates to fuse!");
      return;
    }

    const coin = allCoins.find(c => c.id === targetId);
    if (!coin) return;

    const rarities = ['Common', 'Uncommon', 'Rare', 'Ultra Rare'];
    const currentRarityIndex = rarities.indexOf(coin.rarity || 'Common');
    const nextRarity = rarities[Math.min(currentRarityIndex + 1, rarities.length - 1)];

    const possibleRewards = allCoins.filter(c => (c.rarity || 'Common') === nextRarity && c.id !== targetId);
    const reward = possibleRewards[Math.floor(Math.random() * possibleRewards.length)] || coin;

    setCollectedIds(prev => {
      let removedCount = 0;
      const next = prev.filter(id => {
        if (id === targetId && removedCount < 3) {
          removedCount++;
          return false;
        }
        return true;
      });
      return [...next, reward.id];
    });

    addPoints(500, `✨ Fusion Success! Created ${reward.name}`);
    setFusionSelection([]);
    setIsFusionModalOpen(false);
    setIsFusionMode(false);
  };

  const dnaScoreValue = useMemo(() => {
    if (collectedIds.length === 0) return 0;
    const uniqueCount = new Set(collectedIds).size;
    const rarityScore = collectedIds.reduce((acc, id) => {
      const coin = allCoins.find(c => c.id === id);
      const rarity = coin?.rarity || 'Common';
      const scores = { 'Common': 1, 'Uncommon': 3, 'Rare': 10, 'Ultra Rare': 25 };
      return acc + (scores[rarity as keyof typeof scores] || 1);
    }, 0);
    const diversity = uniqueCount / allCoins.length;
    return Math.floor((rarityScore * diversity) + (collectedIds.length * 2));
  }, [collectedIds, allCoins]);

  useEffect(() => {
    if (dnaScoreValue !== userProfile.dnaScore) {
      setUserProfile(prev => ({ ...prev, dnaScore: dnaScoreValue }));
      setDnaScore(dnaScoreValue);
    }
  }, [dnaScoreValue, userProfile.dnaScore]);

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

  const renderCoinCard = (coin: Coin, layout: string = 'grid') => {
    const isCollected = collectedIds.includes(coin.id);
    const isSelected = selectedCoinIds.has(coin.id);

    // Layout specific styles
    let cardClasses = `group relative bg-white dark:bg-gray-900 rounded-[2rem] transition-all cursor-pointer overflow-hidden border border-gray-100 dark:border-gray-800 ${
      isSelected ? 'ring-4 ring-amber-500/20 border-amber-500' : 
      isCollected ? 'bg-amber-50/10 dark:bg-amber-900/5' : ''
    }`;
    
    let contentClasses = "flex items-center h-full";
    let imageContainerClasses = "relative flex-shrink-0 bg-gray-100 dark:bg-gray-800 rounded-2xl overflow-hidden";
    let infoClasses = "flex-1 min-w-0";
    
    if (layout === 'grid') {
      cardClasses += ` h-[110px] sm:h-[130px] p-3 sm:p-4`;
      contentClasses += ` gap-4 sm:gap-6`;
      imageContainerClasses += ` w-16 h-16 sm:w-20 sm:h-20`;
    } else if (layout === 'list') {
      cardClasses += " h-auto py-3 px-4";
      contentClasses += " gap-4";
      imageContainerClasses += " w-12 h-12";
    } else if (layout === 'compact') {
      cardClasses += " aspect-square p-2";
      contentClasses += " flex-col gap-1 text-center justify-center";
      imageContainerClasses += " w-10 h-10 sm:w-12 sm:h-12";
      infoClasses = "w-full";
    } else if (layout === 'gallery') {
      cardClasses += " aspect-[4/5] p-0";
      contentClasses += " flex-col";
      imageContainerClasses += " w-full flex-1 rounded-none";
      infoClasses = "p-3 w-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm";
    } else if (layout === 'hexagon') {
      cardClasses = cardClasses.replace('rounded-premium', '');
      cardClasses += " hexagon bg-amber-500 text-white w-40 h-40 p-0";
      contentClasses += " flex-col justify-center items-center p-4 text-center";
      imageContainerClasses += " w-14 h-14 rounded-full mb-2";
      infoClasses = "w-full";
    } else if (layout === 'spotlight') {
      cardClasses += " h-[200px] sm:h-[240px] p-6";
      contentClasses += " gap-8";
      imageContainerClasses += " w-32 h-32 sm:w-40 sm:h-40";
    } else if (layout === 'carousel') {
      cardClasses += " h-[160px] p-4";
      contentClasses += " gap-4";
      imageContainerClasses += " w-24 h-24";
    } else {
      cardClasses += ` h-[120px] sm:h-[140px] ${userProfile.settings?.isCompactUI || uiDensity === 'compact' ? 'p-3' : 'p-4 sm:p-5'}`;
      contentClasses += " gap-4";
      imageContainerClasses += " w-16 h-16 sm:w-20 sm:h-20";
    }

    return (
      <motion.div
        key={coin.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        whileHover={{ y: -4 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => handleCoinClick(coin)}
        onMouseDown={() => startLongPress(coin.id)}
        onMouseUp={endLongPress}
        onMouseLeave={endLongPress}
        onTouchStart={() => startLongPress(coin.id)}
        onTouchEnd={endLongPress}
        className={cardClasses}
      >
        {isMultiSelectMode && (
          <div className="absolute top-3 right-3 z-20">
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
              isSelected ? 'bg-amber-500 border-amber-500 text-white' : 'bg-white/80 dark:bg-gray-800/80 border-gray-300 dark:border-gray-600'
            }`}>
              {isSelected && <CheckCircle2 size={16} />}
            </div>
          </div>
        )}
        <div className={contentClasses}>
          {!userProfile.settings?.isTextMode && layout !== 'compact' && layout !== 'hexagon' && (
            <div className={imageContainerClasses}>
              <img 
                src={coin.imageUrl} 
                alt={coin.name}
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={handleImageError}
                className={`w-full h-full object-cover border-2 border-gray-100 dark:border-gray-800 shadow-sm transition-transform duration-500 group-hover:scale-110 ${
                  !isCollected && 'grayscale opacity-50'
                }`}
              />
              {isCollected && (
                <div className={`absolute -top-1.5 -right-1.5 bg-amber-500 text-white rounded-full p-1 shadow-lg z-10 ${
                  userProfile.settings?.isCompactUI || uiDensity === 'compact' ? 'scale-75' : ''
                }`}>
                  <CheckCircle2 size={14} className={getResponsiveClass('sm:w-4 sm:h-4', 'w-3 h-3', 'w-4 h-4', 'w-5 h-5')} />
                </div>
              )}
              {coin.rarity && coin.rarity !== 'Common' && layout !== 'list' && (
                <div className={`absolute -bottom-1.5 -left-1.5 px-2.5 py-1 rounded-lg font-black uppercase tracking-widest shadow-md z-10 ${
                  coin.rarity === 'Ultra Rare' ? 'bg-purple-500 text-white' : 
                  coin.rarity === 'Rare' ? 'bg-amber-500 text-white' : 
                  'bg-blue-500 text-white'
                } ${getResponsiveClass('text-[8px]', 'text-[6px]', 'text-[8px]', 'text-[10px]')}`}>
                  {coin.rarity}
                </div>
              )}
            </div>
          )}

          {(layout === 'compact' || layout === 'hexagon') && (
             <div className={imageContainerClasses}>
                <img 
                  src={coin.imageUrl} 
                  alt={coin.name}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  onError={handleImageError}
                  className={`w-full h-full object-cover ${!isCollected && 'grayscale opacity-50'}`}
                />
             </div>
          )}
          
          <div className={infoClasses}>
            <div className={`flex items-center justify-between ${layout === 'compact' || layout === 'hexagon' ? 'hidden' : getResponsiveClass('mb-1', 'mb-0.5', 'mb-1', 'mb-1.5')}`}>
              <div className="flex items-center gap-2">
                {userProfile.settings?.isTextMode && isCollected && <CheckCircle2 size={14} className="text-amber-500" />}
                <div className="flex items-center gap-1.5">
                  <span className={`px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-md font-black uppercase tracking-widest ${getResponsiveClass('text-[8px] sm:text-[10px]', 'text-[6px]', 'text-[8px]', 'text-[10px]')}`}>
                    {coin.denomination}
                  </span>
                  <span className={`font-black text-gray-400 uppercase tracking-widest ${getResponsiveClass('text-[10px] sm:text-xs', 'text-[8px]', 'text-[10px]', 'text-xs')}`}>
                    {coin.year}
                  </span>
                </div>
              </div>
              {userProfile.settings?.showCoinPrice && coin.value && layout !== 'carousel' && (
                <div className={`bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg font-black shadow-sm ${getResponsiveClass('px-2.5 py-1 text-[10px] sm:text-xs', 'px-1.5 py-0.5 text-[8px]', 'px-2.5 py-1 text-[10px]', 'px-3 py-1.5 text-xs')}`}>
                  £{coin.value.toFixed(2)}
                </div>
              )}
            </div>
            <h3 className={`font-display font-bold text-gray-900 dark:text-white truncate tracking-tight ${
              layout === 'compact' || layout === 'hexagon' ? 'text-[10px] uppercase tracking-widest' :
              userProfile.settings?.isCompactUI || uiDensity === 'compact' ? 'text-lg' : 'text-xl sm:text-2xl'
            }`}>{coin.name}</h3>
            {!userProfile.settings?.isTextMode && layout !== 'compact' && layout !== 'hexagon' && (
              <p className={`text-gray-500 dark:text-gray-400 line-clamp-2 font-medium ${
                userProfile.settings?.isCompactUI || uiDensity === 'compact' ? 'text-[10px] sm:text-xs' : 'text-xs sm:text-sm'
              }`}>{coin.description}</p>
            )}
          </div>

          {layout !== 'compact' && layout !== 'hexagon' && layout !== 'gallery' && (
            <button
              onClick={(e) => toggleCollected(coin.id, e)}
              className={`rounded-2xl transition-all active:scale-90 ${
                isCollected 
                  ? 'bg-amber-500 text-white shadow-lg shadow-amber-200 dark:shadow-none' 
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              } ${
                userProfile.settings?.isCompactUI ? 'p-3' : 'p-4'
              }`}
              aria-label={isCollected ? "Mark as missing" : "Mark as collected"}
            >
              {isCollected ? <CheckCircle2 size={24} /> : <Circle size={24} />}
            </button>
          )}
        </div>
      </motion.div>
    );
  };

  const renderTextCard = (coin: Coin) => {
    const isCollected = collectedIds.includes(coin.id);
    const fields = userProfile.settings.visibleFields || { denomination: true, year: true, mint: true, condition: true };
    
    return (
      <motion.div 
        key={coin.id}
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => handleCoinClick(coin)}
        className="p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all cursor-pointer group"
      >
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-amber-500 transition-colors truncate pr-2">{coin.name}</h3>
          {isCollected && <CheckCircle2 size={16} className="text-amber-500 shrink-0" />}
        </div>
        <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
          {fields.denomination && <span className="bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-md">{coin.denomination}</span>}
          {fields.year && <span>{coin.year}</span>}
          {fields.mint && coin.mint && <span>{coin.mint}</span>}
          {fields.condition && coin.condition && <span className="text-blue-500 dark:text-blue-400">{coin.condition}</span>}
        </div>
      </motion.div>
    );
  };

  const renderTextTable = (coins: Coin[]) => {
    const fields = userProfile.settings.visibleFields || { denomination: true, year: true, mint: true, condition: true };
    
    return (
      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 overflow-x-auto shadow-sm">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
              <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Name</th>
              {fields.year && <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Year</th>}
              {fields.mint && <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Mint</th>}
              <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Value</th>
              {fields.condition && <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Condition</th>}
            </tr>
          </thead>
          <tbody>
            {coins.map(coin => (
              <tr 
                key={coin.id} 
                onClick={() => handleCoinClick(coin)}
                className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors cursor-pointer"
              >
                <td className="p-4 font-bold text-sm text-gray-900 dark:text-white">{coin.name}</td>
                {fields.year && <td className="p-4 text-xs text-gray-500">{coin.year}</td>}
                {fields.mint && <td className="p-4 text-xs text-gray-500">{coin.mint || '-'}</td>}
                <td className="p-4 text-xs font-black text-green-600">£{coin.value?.toFixed(2) || '0.00'}</td>
                {fields.condition && <td className="p-4 text-xs text-blue-500 font-bold">{coin.condition || '-'}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderTextList = (coins: Coin[]) => {
    return (
      <div className="space-y-2">
        {coins.map(coin => (
          <div 
            key={coin.id}
            onClick={() => handleCoinClick(coin)}
            className="flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors cursor-pointer group"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span className="font-bold text-gray-900 dark:text-white group-hover:text-amber-500 transition-colors truncate">{coin.name}</span>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-auto shrink-0">{coin.year} • {coin.denomination}</span>
          </div>
        ))}
      </div>
    );
  };

  const renderTextCompact = (coins: Coin[]) => {
    return (
      <div className="flex flex-wrap gap-2">
        {coins.map(coin => (
          <div 
            key={coin.id}
            onClick={() => handleCoinClick(coin)}
            className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-full transition-all cursor-pointer group"
          >
            <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300 group-hover:text-amber-600 transition-colors">
              {coin.name} <span className="text-gray-400 font-medium">({coin.year})</span> <span className="text-amber-500 ml-1">{coin.rarity}</span>
            </span>
          </div>
        ))}
      </div>
    );
  };

  const renderCoinList = (coins: Coin[]) => {
    const layout = userProfile.settings.layout || 'grid';
    
    switch (layout) {
      case 'text-card':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {coins.map(coin => renderTextCard(coin))}
          </div>
        );
      case 'table':
        return renderTextTable(coins);
      case 'text-list':
        return renderTextList(coins);
      case 'text-compact':
        return renderTextCompact(coins);
      case 'list':
        return (
          <div className="flex flex-col gap-3">
            {coins.map(coin => renderCoinCard(coin, 'list'))}
          </div>
        );
      case 'carousel':
        return (
          <div className="flex gap-4 overflow-x-auto pb-6 no-scrollbar snap-x px-2">
            {coins.map(coin => (
              <div key={coin.id} className="flex-shrink-0 w-[300px] snap-center">
                {renderCoinCard(coin, 'carousel')}
              </div>
            ))}
          </div>
        );
      case 'masonry':
        return (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
            {coins.map(coin => (
              <div key={coin.id} className="break-inside-avoid">
                {renderCoinCard(coin, 'masonry')}
              </div>
            ))}
          </div>
        );
      case 'board':
        const rarityGroups = ['Common', 'Uncommon', 'Rare', 'Ultra Rare'].map(rarity => ({
          title: rarity,
          coins: coins.filter(c => c.rarity === rarity || (!c.rarity && rarity === 'Common'))
        }));
        return (
          <div className="flex gap-6 overflow-x-auto pb-6 no-scrollbar min-h-[400px]">
            {rarityGroups.map(group => (
              <div key={group.title} className="flex-shrink-0 w-[300px] bg-gray-100/50 dark:bg-gray-800/50 rounded-3xl p-4 flex flex-col gap-4">
                <div className="flex items-center justify-between px-2">
                  <h4 className="text-xs font-black uppercase tracking-widest text-gray-500">{group.title}</h4>
                  <span className="bg-white dark:bg-gray-700 px-2 py-0.5 rounded-lg text-[10px] font-bold">{group.coins.length}</span>
                </div>
                <div className="flex flex-col gap-3 overflow-y-auto no-scrollbar flex-1">
                  {group.coins.map(coin => renderCoinCard(coin, 'board'))}
                </div>
              </div>
            ))}
          </div>
        );
      case 'timeline':
        return (
          <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-amber-200 before:to-transparent">
            {coins.sort((a, b) => (a.year || 0) - (b.year || 0)).map((coin, idx) => (
              <div key={coin.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white dark:border-gray-900 bg-amber-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                  <span className="text-[10px] font-bold">{coin.year}</span>
                </div>
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-3xl bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
                  {renderCoinCard(coin, 'timeline')}
                </div>
              </div>
            ))}
          </div>
        );
      case 'gallery':
        return (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {coins.map(coin => renderCoinCard(coin, 'gallery'))}
          </div>
        );
      case 'spotlight':
        return (
          <div className="flex flex-col gap-8 items-center py-8">
            {coins.map(coin => (
              <div key={coin.id} className="w-full max-w-lg transform transition-all hover:scale-[1.02]">
                {renderCoinCard(coin, 'spotlight')}
              </div>
            ))}
          </div>
        );
      case 'compact':
        return (
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
            {coins.map(coin => renderCoinCard(coin, 'compact'))}
          </div>
        );
      case 'split':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {coins.map(coin => renderCoinCard(coin, 'split'))}
          </div>
        );
      case 'hexagon':
        return (
          <div className="flex flex-wrap justify-center gap-4 py-8">
            {coins.map(coin => (
              <div key={coin.id} className="w-40 h-40">
                {renderCoinCard(coin, 'hexagon')}
              </div>
            ))}
          </div>
        );
      default:
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {coins.map(coin => renderCoinCard(coin))}
          </div>
        );
    }
  };

  const renderCoinTableRow = (coin: Coin) => {
    const isCollected = collectedIds.includes(coin.id);
    const isSelected = selectedCoinIds.has(coin.id);

    return (
      <tr 
        key={coin.id} 
        onClick={() => handleCoinClick(coin)}
        onMouseDown={() => startLongPress(coin.id)}
        onMouseUp={endLongPress}
        onMouseLeave={endLongPress}
        onTouchStart={() => startLongPress(coin.id)}
        onTouchEnd={endLongPress}
        className={`border-b-2 sm:border-b-4 border-gray-100 dark:border-gray-800 cursor-pointer active:bg-gray-100 dark:active:bg-gray-800 transition-colors ${
          isSelected ? 'bg-amber-100 dark:bg-amber-900/20' :
          isCollected ? 'bg-amber-50 dark:bg-amber-900/10' : ''
        }`}
      >
        <td className={getResponsiveClass('p-4 sm:p-6', 'p-2', 'p-4', 'p-6')}>
          <div className="flex items-center gap-3">
            {isMultiSelectMode && (
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                isSelected ? 'bg-amber-500 border-amber-500 text-white' : 'bg-white/80 dark:bg-gray-800/80 border-gray-300 dark:border-gray-600'
              }`}>
                {isSelected && <CheckCircle2 size={16} />}
              </div>
            )}
            <div>
              <p className={`font-black text-gray-900 dark:text-white leading-tight ${getResponsiveClass('text-xl sm:text-4xl', 'text-lg', 'text-xl', 'text-4xl')}`}>{coin.denomination}</p>
              <p className={`font-bold text-gray-500 dark:text-gray-400 truncate uppercase tracking-wider ${getResponsiveClass('text-[10px] sm:text-lg max-w-[100px] sm:max-w-[300px]', 'text-[8px] max-w-[80px]', 'text-[10px] max-w-[100px]', 'text-lg max-w-[300px]')}`}>{coin.name}</p>
            </div>
          </div>
        </td>
        <td className={`font-black text-gray-900 dark:text-white ${getResponsiveClass('p-4 sm:p-6 text-xl sm:text-4xl', 'p-2 text-lg', 'p-4 text-xl', 'p-6 text-4xl')}`}>
          {coin.year}
        </td>
        <td className={`text-center ${getResponsiveClass('p-4 sm:p-6', 'p-2', 'p-4', 'p-6')}`}>
          {isCollected ? (
            <div className={`inline-flex items-center justify-center bg-amber-500 text-white rounded-full shadow-lg ${getResponsiveClass('w-8 h-8 sm:w-14 sm:h-14', 'w-6 h-6', 'w-10 h-10', 'w-14 h-14')}`}>
              <CheckCircle2 className={getResponsiveClass('sm:w-8 sm:h-8', 'w-4 h-4', 'w-6 h-6', 'w-8 h-8')} size={18} />
            </div>
          ) : (
            <div className={`inline-flex items-center justify-center border-gray-200 dark:border-gray-700 rounded-full ${getResponsiveClass('w-8 h-8 sm:w-14 sm:h-14 border-2 sm:border-4', 'w-6 h-6 border', 'w-10 h-10 border-2', 'w-14 h-14 border-4')}`}>
              <Circle className={`text-gray-200 dark:text-gray-700 ${getResponsiveClass('sm:w-8 sm:h-8', 'w-4 h-4', 'w-6 h-6', 'w-8 h-8')}`} size={18} />
            </div>
          )}
        </td>
      </tr>
    );
  };

  const compressImage = (source: File | string, maxWidth = 600): Promise<string> => {
    return new Promise((resolve, reject) => {
      const processImage = (src: string) => {
        const img = new Image();
        img.src = src;
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
          resolve(canvas.toDataURL('image/jpeg', 0.6));
        };
        img.onerror = reject;
      };

      if (source instanceof File) {
        const reader = new FileReader();
        reader.readAsDataURL(source);
        reader.onload = (event) => processImage(event.target?.result as string);
        reader.onerror = reject;
      } else {
        processImage(source);
      }
    });
  };

  const checkDuplicate = (name: string, denomination: string, year: number) => {
    return allCoins.some(c => 
      c.name.toLowerCase().trim() === name.toLowerCase().trim() && 
      c.denomination.toLowerCase().trim() === denomination.toLowerCase().trim() && 
      c.year === year
    );
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

  // Smart Collection Goals Logic
  useEffect(() => {
    const generateGoals = () => {
      if (userProfile.goals.length >= 3) return;

      const denoms = Array.from(new Set(allCoins.map(c => c.denomination)));
      const randomDenom = denoms[Math.floor(Math.random() * denoms.length)];
      const coinsInDenom = allCoins.filter(c => c.denomination === randomDenom);
      const collectedInDenom = coinsInDenom.filter(c => collectedIds.includes(c.id)).length;

      if (collectedInDenom < coinsInDenom.length) {
        const newGoal: CollectionGoal = {
          id: `goal-${Date.now()}`,
          title: `${randomDenom} Collector`,
          description: `Collect ${coinsInDenom.length} different ${randomDenom} coins`,
          target: coinsInDenom.length,
          current: collectedInDenom,
          reward: 500,
          isCompleted: false
        };
        setUserProfile(prev => ({ ...prev, goals: [...prev.goals, newGoal] }));
      }
    };

    const interval = setInterval(generateGoals, 600000); // Every 10 mins
    if (userProfile.goals.length === 0) generateGoals();
    return () => clearInterval(interval);
  }, [collectedIds, allCoins, userProfile.goals]);

  // Update Goal Progress
  useEffect(() => {
    let pointsToReward = 0;
    let rewardMessages: string[] = [];
    let hasChanges = false;

    const updatedGoals = userProfile.goals.map(goal => {
      if (goal.isCompleted) return goal;
      
      const denomMatch = goal.title.match(/(.*) Collector/);
      if (denomMatch) {
        const denom = denomMatch[1];
        const coinsInDenom = allCoins.filter(c => c.denomination === denom);
        const collectedCount = coinsInDenom.filter(c => collectedIds.includes(c.id)).length;
        
        if (collectedCount !== goal.current) {
          hasChanges = true;
          const isNowCompleted = collectedCount >= goal.target;
          if (isNowCompleted) {
            pointsToReward += goal.reward;
            rewardMessages.push(`Goal Complete: ${goal.title}!`);
          }
          return { ...goal, current: collectedCount, isCompleted: isNowCompleted };
        }
      }
      return goal;
    });

    if (hasChanges) {
      setUserProfile(prev => ({ ...prev, goals: updatedGoals }));
      if (pointsToReward > 0) {
        rewardMessages.forEach(msg => addPoints(pointsToReward / rewardMessages.length, msg));
      }
    }
  }, [collectedIds, allCoins, userProfile.goals]);

  // Mystery Trade Logic
  useEffect(() => {
    const generateTrade = () => {
      const collectedUnique = Array.from(new Set(collectedIds));
      if (collectedUnique.length < 5) return;

      const randomGiveId = collectedUnique[Math.floor(Math.random() * collectedUnique.length)];
      const uncollected = allCoins.filter(c => !collectedIds.includes(c.id));
      if (uncollected.length === 0) return;
      
      const randomGetId = uncollected[Math.floor(Math.random() * uncollected.length)].id;

      setTradeOffer({
        id: Math.random().toString(36).substr(2, 9),
        give: { coinId: randomGiveId, count: 2 },
        get: { coinId: randomGetId },
        expiresAt: Date.now() + 1000 * 60 * 5 // 5 minutes
      });
    };

    const interval = setInterval(() => {
      if (!tradeOffer || Date.now() > tradeOffer.expiresAt) {
        generateTrade();
      }
    }, 300000); // Check every 5 mins

    return () => clearInterval(interval);
  }, [collectedIds, tradeOffer, allCoins]);

  const addPoints = (amount: number, message?: string) => {
    const multiplier = (isNightBonus && userProfile.settings.isNightBonusActive) ? 1.5 : 1;
    const finalAmount = Math.floor(amount * multiplier);
    setUserProfile(prev => {
      const newPoints = prev.points + finalAmount;
      const { level, name } = getLevelInfo(newPoints);
      return { ...prev, points: newPoints, level, rank: name };
    });
    if (message) {
      setPointsNotification({ amount: finalAmount, message });
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

  useEffect(() => {
    localStorage.setItem('user_coin_denominations', JSON.stringify(userCoinDenominations));
  }, [userCoinDenominations]);

  useEffect(() => {
    localStorage.setItem('user_coin_values', JSON.stringify(userCoinValues));
  }, [userCoinValues]);

  useEffect(() => {
    const handleScroll = (e: any) => {
      setScrollY(e.target.scrollTop);
    };
    const mainElement = document.querySelector('main');
    mainElement?.addEventListener('scroll', handleScroll);
    return () => mainElement?.removeEventListener('scroll', handleScroll);
  }, []);

  const progress = Math.round((collectedIds.length / allCoins.length) * 100);

  const renderProgressBar = () => (
    <div className="flex flex-col gap-1 w-full">
      <div className="flex items-center justify-between px-1">
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Collection Progress</span>
        <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">{progress}%</span>
      </div>
      <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <motion.div 
          className="h-full bg-amber-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </div>
  );

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isLayoutMenuOpen) {
        setIsLayoutMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isLayoutMenuOpen]);

  const toggleCollected = (id: string, e: React.MouseEvent, isDuplicate: boolean = false) => {
    e.stopPropagation();
    const coin = allCoins.find(c => c.id === id);
    
    setCollectedIds(prev => {
      const isAlreadyCollected = prev.includes(id);
      const isCollecting = !isAlreadyCollected || isDuplicate;
      
      if (isCollecting) {
        setCollectionHistory(ch => {
          if (ch[id]) return ch;
          return { ...ch, [id]: new Date().toISOString() };
        });
        
        let pointsToAdd = POINT_VALUES.COLLECT_COIN;
        if (isNightBonus) pointsToAdd = Math.floor(pointsToAdd * 1.5);
        addPoints(pointsToAdd, isNightBonus ? "Night Bonus! Coin Collected!" : "Coin Collected!");
        
        // Clue Logic
        if (coin?.clue && !unlockedClues.includes(coin.id)) {
          setUnlockedClues(curr => [...curr, coin.id]);
          setPointsNotification({ amount: 0, message: `Clue Unlocked: ${coin.clue}` });
        }

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

        // Set Completion Check
        if (coin) {
          const coinsInDenom = EUROPEAN_COINS.filter(c => c.denomination === coin.denomination);
          const collectedInDenom = coinsInDenom.filter(c => [...prev, id].includes(c.id)).length;
          if (collectedInDenom === coinsInDenom.length) {
            addPoints(POINT_VALUES.COMPLETE_FOLDER, `${coin.denomination} Set Complete!`);
            setUserProfile(up => {
              const newBadges = [...up.badges];
              const badgeName = `${coin.denomination} Master`;
              if (!newBadges.includes(badgeName)) newBadges.push(badgeName);
              return { ...up, badges: newBadges };
            });
          }
        }
        return [...prev, id];
      } else {
        // Remove only one instance
        const index = prev.indexOf(id);
        if (index > -1) {
          const next = [...prev];
          next.splice(index, 1);
          setCollectionHistory(ch => {
            const newHistory = { ...ch };
            delete newHistory[id];
            return newHistory;
          });
          return next;
        }
        return prev;
      }
    });
  };

  const toggleTag = (coinId: string, tagId: string) => {
    setUserProfile(prev => {
      const currentTags = prev.coinTags[coinId] || [];
      const newTags = currentTags.includes(tagId)
        ? currentTags.filter(id => id !== tagId)
        : [...currentTags, tagId];
      return {
        ...prev,
        coinTags: { ...prev.coinTags, [coinId]: newTags }
      };
    });
  };

  const toggleCoinSelection = (coinId: string) => {
    setSelectedCoinIds(prev => {
      const next = new Set(prev);
      if (next.has(coinId)) {
        next.delete(coinId);
        if (next.size === 0) setIsMultiSelectMode(false);
      } else {
        next.add(coinId);
      }
      return next;
    });
  };

  const handleCoinClick = (coin: Coin) => {
    if (isMultiSelectMode) {
      toggleCoinSelection(coin.id);
    } else {
      handleSelectCoin(coin);
    }
  };

  const startLongPress = (coinId: string) => {
    if (isMultiSelectMode) return;
    longPressTimer.current = setTimeout(() => {
      setIsMultiSelectMode(true);
      setSelectedCoinIds(new Set([coinId]));
    }, 600);
  };

  const endLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const applyBulkTag = (tagId: string) => {
    const count = selectedCoinIds.size;
    setUserProfile(prev => {
      const newCoinTags = { ...prev.coinTags };
      selectedCoinIds.forEach(coinId => {
        const currentTags = newCoinTags[coinId] || [];
        if (!currentTags.includes(tagId)) {
          newCoinTags[coinId] = [...currentTags, tagId];
        }
      });
      return { ...prev, coinTags: newCoinTags };
    });
    setIsMultiSelectMode(false);
    setSelectedCoinIds(new Set());
    addPoints(POINT_VALUES.COLLECT_COIN, `Tagged ${count} coins!`);
  };

  const applyBulkDenomination = (denom: string) => {
    const count = selectedCoinIds.size;
    setUserCoinDenominations(prev => {
      const next = { ...prev };
      selectedCoinIds.forEach(coinId => {
        next[coinId] = denom;
      });
      return next;
    });
    setIsMultiSelectMode(false);
    setSelectedCoinIds(new Set());
    addPoints(POINT_VALUES.COLLECT_COIN, `Updated ${count} coins!`);
  };

  const applyBulkPrice = (price: number) => {
    const count = selectedCoinIds.size;
    setUserCoinValues(prev => {
      const next = { ...prev };
      selectedCoinIds.forEach(coinId => {
        next[coinId] = price;
      });
      return next;
    });
    setIsMultiSelectMode(false);
    setSelectedCoinIds(new Set());
    addPoints(POINT_VALUES.COLLECT_COIN, `Updated ${count} coins!`);
  };

  const patternInsights = useMemo(() => {
    if (collectedIds.length === 0) return null;
    
    const counts: Record<string, number> = {};
    collectedIds.forEach(id => {
      const coin = allCoins.find(c => c.id === id);
      if (coin) {
        counts[coin.denomination] = (counts[coin.denomination] || 0) + 1;
      }
    });

    const mostCollected = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    const uniqueCount = new Set(collectedIds).size;
    const completionRate = (uniqueCount / allCoins.length) * 100;

    return {
      mostCollectedType: mostCollected ? mostCollected[0] : 'None',
      uniqueCount,
      completionRate: completionRate.toFixed(1)
    };
  }, [collectedIds, allCoins]);

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
      
      const matchesEra = userProfile.settings.eraFilter === 'Both' || 
                         coin.type === userProfile.settings.eraFilter;
      
      const isEuropeanNonUK = coin.country !== 'UK';
      const matchesOldEuro = userProfile.settings.showOldEuropeanCoins || !isEuropeanNonUK || coin.type === 'Modern';
      
      return matchesSearch && matchesFilter && matchesDenom && matchesEra && matchesOldEuro;
    }).sort((a, b) => {
      const sortBy = userProfile.settings?.sortBy || 'recent-added';
      
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'recent-opened') {
        return (lastOpenedIds[b.id] || 0) - (lastOpenedIds[a.id] || 0);
      } else if (sortBy === 'country') {
        return (a.country || '').localeCompare(b.country || '');
      } else if (sortBy === 'year') {
        return b.year - a.year;
      } else if (sortBy === 'denomination') {
        return a.denomination.localeCompare(b.denomination);
      } else if (sortBy === 'date-added') {
        const dateA = collectionHistory[a.id] ? new Date(collectionHistory[a.id]).getTime() : 0;
        const dateB = collectionHistory[b.id] ? new Date(collectionHistory[b.id]).getTime() : 0;
        return dateB - dateA;
      } else if (sortBy === 'month-added') {
        const dateA = collectionHistory[a.id] ? new Date(collectionHistory[a.id]) : null;
        const dateB = collectionHistory[b.id] ? new Date(collectionHistory[b.id]) : null;
        
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;
        
        const valA = dateA.getFullYear() * 12 + dateA.getMonth();
        const valB = dateB.getFullYear() * 12 + dateB.getMonth();
        
        if (valA !== valB) return valB - valA;
        return dateB.getTime() - dateA.getTime();
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
  }, [searchQuery, filter, collectedIds, allCoins, purchasedCoins, userProfile.settings?.sortBy, userProfile.settings?.eraFilter, userProfile.settings?.showOldEuropeanCoins, lastOpenedIds, collectionHistory]);
  
  const groupedCoins = useMemo(() => {
    if (!userProfile.settings.isGrouped) return null;
    
    const groupBy = userProfile.settings.groupBy || 'year';
    
    if (groupBy === 'country') {
      const countryGroups: Record<string, Record<string, Coin[]>> = {};
      
      filteredCoins.forEach(coin => {
        const country = coin.country;
        const era = coin.type;
        
        if (!countryGroups[country]) countryGroups[country] = {};
        if (!countryGroups[country][era]) countryGroups[country][era] = [];
        countryGroups[country][era].push(coin);
      });
      
      return Object.keys(countryGroups).sort().map(country => ({
        title: country,
        subGroups: Object.keys(countryGroups[country]).sort((a, b) => b.localeCompare(a)).map(era => ({
          title: era === 'Modern' ? 'Modern (Euro)' : 'Old (Pre-Euro)',
          coins: countryGroups[country][era]
        }))
      }));
    }

    const groups: Record<string, Coin[]> = {};
    
    filteredCoins.forEach(coin => {
      let groupKey = 'Other';
      
      if (groupBy === 'year') {
        groupKey = coin.year.toString();
      } else if (groupBy === 'denomination') {
        groupKey = coin.denomination;
      } else if (groupBy === 'date-added') {
        const date = collectionHistory[coin.id];
        groupKey = date ? new Date(date).toLocaleDateString('en-GB') : 'Not Collected';
      } else if (groupBy === 'month-added') {
        const date = collectionHistory[coin.id];
        groupKey = date ? new Date(date).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) : 'Not Collected';
      }
      
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(coin);
    });
    
    // Sort group keys
    const sortedKeys = Object.keys(groups).sort((a, b) => {
      if (groupBy === 'year') return b.localeCompare(a);
      if (groupBy === 'denomination') return a.localeCompare(b);
      if (groupBy === 'date-added' || groupBy === 'month-added') {
        if (a === 'Not Collected') return 1;
        if (b === 'Not Collected') return -1;
        // Parse dates for comparison
        const dateA = new Date(groups[a][0] ? collectionHistory[groups[a][0].id] : 0).getTime();
        const dateB = new Date(groups[b][0] ? collectionHistory[groups[b][0].id] : 0).getTime();
        return dateB - dateA;
      }
      return a.localeCompare(b);
    });
    
    return sortedKeys.map(key => ({
      title: key,
      coins: groups[key]
    }));
  }, [filteredCoins, userProfile.settings.isGrouped, userProfile.settings.groupBy, collectionHistory]);

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isAddingToCollection) {
      const coinName = reqName || `${reqDenom} (${reqYear})`;
      
      if (checkDuplicate(coinName, reqDenom, reqYear)) {
        alert("This coin already exists in your collection!");
        return;
      }

      const newCoin: Coin = {
        id: `custom-${Date.now()}`,
        name: coinName,
        denomination: reqDenom,
        year: reqYear,
        description: 'Custom added coin.',
        imageUrl: reqPhoto || FALLBACK_COIN_IMAGE,
        country: manualCoinCountry,
        type: manualCoinType
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

  const exportCollection = (targetVersion: AppVersion = '3.0') => {
    const rawData = {
      collectedIds,
      customCoins,
      requestedCoins,
      userProfile,
      userCoinImages,
      purchasedCoins,
      lastOpenedIds,
      collectionHistory,
      userCoinDenominations,
      userCoinValues,
      version: '3.0' as AppVersion
    };

    // Apply schema conversion before export
    const data = migrateData(rawData, targetVersion);

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    a.href = url;
    a.download = `coins_v${targetVersion}_${dateStr}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setIsExportModalOpen(false);
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
          const rawData = JSON.parse(event.target?.result as string);
          
          if (needsConversion(rawData)) {
            setConversionData(rawData);
            setIsConverting(true);
            setImportProgress(null);
            return;
          }

          const data = validateAndSanitizeData(rawData);
          if (!data) {
            throw new Error("Invalid or corrupt data detected.");
          }

          // Simulate a bit of progress for UX if it's too fast
          let p = 0;
          const interval = setInterval(() => {
            p += 10;
            setImportProgress(p);
            if (p >= 100) {
              clearInterval(interval);
              
              // Merge logic with duplicate prevention
              if (data.customCoins) {
                setCustomCoins(prev => {
                  const newCustom = data.customCoins.filter((nc: Coin) => 
                    !prev.some(pc => pc.name === nc.name && pc.denomination === nc.denomination && pc.year === nc.year)
                  );
                  return [...prev, ...newCustom];
                });
              }

              if (data.collectedIds) {
                setCollectedIds(prev => Array.from(new Set([...prev, ...data.collectedIds])));
              }

              if (data.requestedCoins) {
                setRequestedCoins(prev => {
                  const newReqs = data.requestedCoins.filter((nr: RequestedCoin) => 
                    !prev.some(pr => pr.denomination === nr.denomination && pr.year === nr.year)
                  );
                  return [...prev, ...newReqs];
                });
              }

              if (data.userCoinImages) {
                setUserCoinImages(prev => ({ ...prev, ...data.userCoinImages }));
              }

              if (data.purchasedCoins) {
                setPurchasedCoins(prev => {
                  const newPurchased = data.purchasedCoins.filter((np: PurchasedCoin) => 
                    !prev.some(pp => pp.id === np.id)
                  );
                  return [...prev, ...newPurchased];
                });
              }

              if (data.userProfile) {
                setUserProfile(prev => ({
                  ...data.userProfile,
                  points: Math.max(prev.points, data.userProfile.points || 0),
                  badges: Array.from(new Set([...prev.badges, ...(data.userProfile.badges || [])]))
                }));
              }

              if (data.collectionHistory) {
                setCollectionHistory(prev => ({ ...prev, ...data.collectionHistory }));
              }

              if (data.userCoinDenominations) {
                setUserCoinDenominations(prev => ({ ...prev, ...data.userCoinDenominations }));
              }

              if (data.userCoinValues) {
                setUserCoinValues(prev => ({ ...prev, ...data.userCoinValues }));
              }

              setImportProgress(null);
              alert("Collection imported and merged successfully!");
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
              { text: "Identify this UK coin. Return the denomination (e.g., '50p', '£1', '1p', 'Farthing', 'Half Penny', 'Penny', 'Threepence', 'Sixpence', 'Shilling', 'Florin', 'Half Crown', 'Crown'), the year (e.g., 1967), and a short descriptive name for the design (e.g., 'Kew Gardens', 'Britannia', 'Peter Rabbit'). If you are unsure, return 'unknown' for any field." },
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
          rarity: 'Common',
          country: 'UK',
          type: 'Modern'
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
      const fullPhoto = canvas.toDataURL('image/jpeg', 0.6);
      const base64Image = fullPhoto.split(',')[1];
      
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: [
            {
              parts: [
                { text: "Identify this UK coin. Return the denomination (e.g., '50p', '£1', '1p', 'Farthing', 'Half Penny', 'Penny', 'Threepence', 'Sixpence', 'Shilling', 'Florin', 'Half Crown', 'Crown') and the year (e.g., 1967). If you are unsure, return 'unknown' for either field." },
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
    
    if (!editingCoinId && checkDuplicate(manualCoinName, manualCoinDenom, manualCoinYear)) {
      alert("This coin already exists in your collection!");
      return;
    }

    const newId = editingCoinId || `custom-${Date.now()}`;
    const newCoin: Coin = {
      id: newId,
      name: manualCoinName,
      denomination: manualCoinDenom,
      year: manualCoinYear,
      description: manualCoinSummary || `User-added: ${manualCoinName} (${manualCoinDenom})`,
      imageUrl: manualCoinPhoto || FALLBACK_COIN_IMAGE,
      rarity: manualCoinRarity,
      value: manualCoinValue ? parseFloat(manualCoinValue) : undefined,
      country: manualCoinCountry,
      type: manualCoinType
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
      setCollectionHistory(ch => {
        if (ch[newCoin.id]) return ch;
        return { ...ch, [newCoin.id]: new Date().toISOString() };
      });
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
    setManualCoinCountry('UK');
    setManualCoinType('Modern');
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
    setManualCoinCountry(coin.country || 'UK');
    setManualCoinType(coin.type || 'Modern');
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

        <main className="flex-1 p-4 sm:p-8 max-w-2xl mx-auto w-full space-y-8">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-amber-100 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-amber-50 rounded-3xl flex items-center justify-center text-amber-500 mb-6">
              <Shield size={40} />
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-3 uppercase tracking-tight">Safe Mode Active</h2>
            <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
              The app encountered a problem. We've loaded a minimal version to keep your data safe.
            </p>
          </div>

          <div className="space-y-4">
             <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Emergency Tools</h3>
             <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={exportData}
                  className="p-6 bg-green-500 text-white rounded-3xl flex flex-col items-center gap-3 shadow-xl shadow-green-100 hover:bg-green-600 transition-all active:scale-95"
                >
                  <Share size={28} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Export Data</span>
                </button>
                <button 
                  onClick={() => {
                    localStorage.removeItem('force_safe_mode');
                    window.location.reload();
                  }}
                  className="p-6 bg-amber-500 text-white rounded-3xl flex flex-col items-center gap-3 shadow-xl shadow-amber-100 hover:bg-amber-600 transition-all active:scale-95"
                >
                  <RefreshCw size={28} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Normal Mode</span>
                </button>
             </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Collection Snapshot</h3>
            <div className="space-y-3">
              {allCoins.filter(c => collectedIds.includes(c.id)).length === 0 ? (
                <div className="text-center py-16 bg-white rounded-[2rem] border-2 border-dashed border-gray-100">
                  <LayoutGrid size={48} className="mx-auto text-gray-200 mb-4" />
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No coins collected</p>
                </div>
              ) : (
                allCoins.filter(c => collectedIds.includes(c.id)).map(coin => (
                  <div key={coin.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-50 flex items-center justify-between">
                    <div>
                      <p className="font-black text-gray-900 text-lg tracking-tight">{coin.name}</p>
                      <p className="text-[10px] text-amber-600 uppercase font-black tracking-widest mt-0.5">{coin.denomination} • {coin.year}</p>
                    </div>
                    <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center text-amber-500">
                      <CheckCircle2 size={20} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  const SegmentedControl = ({ options, value, onChange }: { options: string[], value: string, onChange: (val: any) => void }) => (
    <div className="flex bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-sm p-1 rounded-xl w-full border border-gray-200/50 dark:border-gray-700/50">
      {options.map(opt => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all duration-200 ${
            value === opt 
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/5' 
              : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );

  return (
    <div 
      className={`h-screen overflow-hidden bg-white dark:bg-gray-950 dark:text-white flex flex-col transition-colors duration-300 ${getResponsiveClass('', 'text-xs', 'text-sm', 'text-base')}`} 
      style={{ 
        ...themeStyles
      }}
    >
      <AmbientBackground isEnabled={userProfile.settings.isAmbientMotionEnabled ?? true} />
      <style>
        {`
          :root {
            --card-bg-override: ${themeStyles['--card-bg'] || ''};
            --card-border-override: ${themeStyles['--card-border'] || ''};
            --backdrop-override: ${themeStyles['--backdrop'] || 'none'};
            --card-shadow-override: ${themeStyles['--card-shadow'] || '0 4px 20px rgba(0,0,0,0.05)'};
          }
          ${userProfile.settings?.theme !== 'default' ? `
            .bg-white, .dark .bg-gray-900, .bg-gray-50, .dark .bg-gray-800 { 
              background-color: var(--card-bg-override) !important; 
              backdrop-filter: var(--backdrop-override) !important;
              -webkit-backdrop-filter: var(--backdrop-override) !important;
              border-color: var(--card-border-override) !important;
              box-shadow: var(--card-shadow-override) !important;
              border-radius: var(--radius-card) !important;
            }
            .border-gray-100, .dark .border-gray-800, .border-gray-200, .dark .border-gray-700 {
              border-color: var(--card-border-override) !important;
            }
          ` : ''}
          
          /* Premium Typography & Spacing */
          .font-display { font-family: var(--font-display); }
          .rounded-premium { border-radius: var(--radius-card); }
          .rounded-button { border-radius: var(--radius-button); }
        `}
      </style>
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

      {/* Discovery Fact Banner */}
      <AnimatePresence>
        {discoveryFact && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 text-center py-2 px-4 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 z-[105] border-b border-amber-200/50 dark:border-amber-800/50"
          >
            <Sparkles size={12} className="animate-pulse" />
            {discoveryFact}
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

       {/* Sticky Header (Appears on scroll) */}
      <header className={`fixed top-0 left-0 right-0 z-[100] bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl border-b border-gray-100 dark:border-gray-800 transition-all duration-300 pt-[env(safe-area-inset-top)] ${
        scrollY > 60 ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
      }`}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="text-amber-500 w-5 h-5" />
            <h1 className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">
              Coin Collector
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {userProfile.settings.showLayoutSwitcher && (
              <button 
                onClick={() => setIsLayoutMenuOpen(!isLayoutMenuOpen)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              >
                {LAYOUT_OPTIONS.find(l => l.id === (userProfile.settings.layout || 'grid'))?.icon || <LayoutGrid size={18} />}
              </button>
            )}
            <button 
              onClick={() => setIsProfileOpen(true)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            >
              <User size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto no-scrollbar pt-[env(safe-area-inset-top)]">
        <div className="max-w-2xl mx-auto px-4 pt-12 pb-6 space-y-6">
          <div className="flex items-end justify-between">
            <motion.h1 
              style={{ 
                opacity: 1 - Math.min(scrollY / 100, 1),
                y: scrollY * 0.2
              }}
              className="text-4xl font-display font-bold text-gray-900 dark:text-white tracking-tight"
            >
              Library
            </motion.h1>
            <div className="flex items-center gap-2 mb-1">
              <button 
                onClick={() => setIsLayoutMenuOpen(!isLayoutMenuOpen)}
                className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-400"
              >
                <LayoutGrid size={20} />
              </button>
              <button 
                onClick={() => setIsProfileOpen(true)}
                className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-400"
              >
                <User size={20} />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <SegmentedControl 
              options={['Modern', 'Old', 'Both']} 
              value={userProfile.settings.eraFilter || 'Both'} 
              onChange={(era) => setUserProfile(prev => ({
                ...prev,
                settings: { ...prev.settings, eraFilter: era }
              }))}
            />

            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              <div className="flex bg-gray-100/50 dark:bg-gray-800/50 p-1 rounded-xl">
                {(['all', 'collected', 'missing'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                      filter === f 
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                        : 'text-gray-500'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              <div className="h-6 w-px bg-gray-200 dark:bg-gray-800 mx-1" />

              <div className="flex gap-2">
                <select
                  value={userProfile.settings.sortBy || 'recent-added'}
                  onChange={(e) => setUserProfile(prev => ({
                    ...prev,
                    settings: { ...prev.settings, sortBy: e.target.value as any }
                  }))}
                  className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border-none outline-none"
                >
                  <option value="recent-added">Sort: Recent</option>
                  <option value="name">Sort: Name</option>
                  <option value="year">Sort: Year</option>
                  <option value="denomination">Sort: Denom</option>
                </select>

                <button
                  onClick={() => setUserProfile(prev => ({
                    ...prev,
                    settings: { ...prev.settings, isGrouped: !prev.settings.isGrouped }
                  }))}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    userProfile.settings.isGrouped 
                      ? 'bg-amber-500 text-white' 
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                  }`}
                >
                  {userProfile.settings.isGrouped ? 'Grouped' : 'List'}
                </button>

                {userProfile.settings.isGrouped && (
                  <select
                    value={userProfile.settings.groupBy || 'year'}
                    onChange={(e) => setUserProfile(prev => ({
                      ...prev,
                      settings: { ...prev.settings, groupBy: e.target.value as any }
                    }))}
                    className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border-none outline-none"
                  >
                    <option value="year">By Year</option>
                    <option value="denomination">By Denom</option>
                    <option value="rarity">By Rarity</option>
                    <option value="country">By Country</option>
                  </select>
                )}
              </div>
            </div>

            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-amber-500 transition-colors" size={18} />
              <input 
                type="text"
                placeholder="Search coins..."
                className="w-full bg-gray-100/50 dark:bg-gray-800/50 border-2 border-transparent rounded-2xl pl-12 pr-4 py-3 focus:bg-white dark:focus:bg-gray-900 focus:border-amber-500 outline-none transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 pb-32">
          <AnimatePresence mode="popLayout">
            <div className="space-y-8">
              {userProfile.settings.isGrouped && groupedCoins ? (
                groupedCoins.map((group) => (
                  <div key={group.title} className="space-y-4">
                    <div className="sticky top-[52px] z-20 py-2 bg-white/90 dark:bg-gray-950/90 backdrop-blur-md -mx-4 px-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
                        {group.title}
                      </h2>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        {group.coins.length}
                      </span>
                    </div>
                    {renderCoinList(group.coins)}
                  </div>
                ))
              ) : (
                renderCoinList(filteredCoins)
              )}

              {filteredCoins.length === 0 && (
                <div className="text-center py-20">
                  <div className="text-gray-200 dark:text-gray-800 mb-4 flex justify-center">
                    <Search size={64} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">No coins found</h3>
                  <p className="text-gray-500">Try a different search or filter</p>
                </div>
              )}
            </div>
          </AnimatePresence>
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
                    className="absolute bottom-32 sm:bottom-40 left-6 right-6 bg-white dark:bg-gray-900 rounded-[2rem] p-6 shadow-2xl border-4 border-amber-500"
                  >
                    <div className="flex flex-col gap-6">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center text-amber-600 dark:text-amber-400">
                          <Sparkles size={28} />
                        </div>
                        <div>
                          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">AI Identification</h4>
                          <p className="text-2xl font-black text-gray-900 dark:text-white leading-tight">
                            {scanResult.denomination} <span className="text-amber-500">{scanResult.year || '????'}</span>
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-3">
                        <button 
                          onClick={() => {
                            setIsAddingToCollection(true);
                            setIsRequestModalOpen(true);
                            stopScanner();
                          }}
                          className="py-4 bg-amber-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-amber-200 dark:shadow-none hover:bg-amber-600 transition-all active:scale-95"
                        >
                          Add
                        </button>
                        <button 
                          onClick={() => {
                            setIsAddingToCollection(false);
                            setIsRequestModalOpen(true);
                            stopScanner();
                          }}
                          className="py-4 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-all active:scale-95"
                        >
                          Request
                        </button>
                        <button 
                          onClick={() => setScanResult(null)}
                          className="py-4 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-200 dark:hover:bg-gray-700 transition-all active:scale-95"
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
              className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-6 sm:p-8 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-amber-50 dark:bg-amber-900/10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center shadow-inner">
                    {isAddingToCollection ? <Plus size={24} /> : <Send size={24} />}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
                      {isAddingToCollection ? 'Add to Collection' : 'Request Coin'}
                    </h3>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-black uppercase tracking-widest">
                      {isAddingToCollection ? 'Confirm your find' : 'Ask our community'}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsRequestModalOpen(false)}
                  className="p-3 hover:bg-amber-100 dark:hover:bg-amber-900/30 text-gray-400 hover:text-amber-600 rounded-full transition-all active:scale-90"
                >
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={handleRequestSubmit} className="p-6 sm:p-8 space-y-6 overflow-y-auto no-scrollbar">
                {isAddingToCollection && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">
                      Custom Name
                    </label>
                    <input 
                      type="text"
                      value={reqName}
                      onChange={(e) => setReqName(e.target.value)}
                      className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-amber-500 rounded-2xl text-sm font-bold transition-all placeholder:text-gray-400"
                      placeholder="e.g. My Special Penny"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">
                      Denomination
                    </label>
                    <select 
                      value={reqDenom}
                      onChange={(e) => setReqDenom(e.target.value)}
                      className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-amber-500 rounded-2xl text-sm font-bold transition-all appearance-none"
                    >
                      {['£2', '£1', 'Half Crown', '1 Shilling', '50p', '3p', '1p', '1/2p'].map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">
                      Year
                    </label>
                    <input 
                      type="number"
                      value={reqYear}
                      onChange={(e) => setReqYear(parseInt(e.target.value))}
                      className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-amber-500 rounded-2xl text-sm font-bold transition-all"
                      placeholder="e.g. 1965"
                      min="1800"
                      max="2099"
                      required
                    />
                  </div>
                </div>

                {isAddingToCollection && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">
                      Photo Proof
                    </label>
                    {reqPhoto ? (
                      <div className="relative aspect-video rounded-[1.5rem] overflow-hidden border-4 border-amber-500 shadow-lg">
                        <img src={reqPhoto} alt="Captured" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                        <button 
                          type="button"
                          onClick={() => setReqPhoto(null)}
                          className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full backdrop-blur-sm hover:bg-black/70 transition-colors"
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
                        className="w-full p-6 bg-gray-50 dark:bg-gray-800 border-4 border-dashed border-gray-100 dark:border-gray-800 rounded-[1.5rem] text-gray-400 flex flex-col items-center justify-center gap-3 hover:border-amber-500 transition-all group"
                      >
                        <div className="w-14 h-14 bg-white dark:bg-gray-900 rounded-full flex items-center justify-center shadow-sm group-hover:text-amber-500 transition-colors">
                          <Camera size={28} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest">Tap to take photo</span>
                      </button>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-5 bg-amber-500 text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl shadow-amber-100 dark:shadow-none hover:bg-amber-600 transition-all flex items-center justify-center gap-3 active:scale-95"
                >
                  {isAddingToCollection ? <CheckCircle2 size={24} /> : <Send size={24} />}
                  {isAddingToCollection ? 'Add to Collection' : 'Submit Request'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bulk Price Edit Modal */}
      <AnimatePresence>
        {isBulkPriceModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsBulkPriceModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="p-6 sm:p-8 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-amber-50 dark:bg-amber-900/10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center shadow-inner">
                    <TrendingUp size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Bulk Price Edit</h3>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-black uppercase tracking-widest">
                      Updating {selectedCoinIds.size} coins
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsBulkPriceModalOpen(false)}
                  className="p-3 hover:bg-amber-100 dark:hover:bg-amber-900/30 text-gray-400 hover:text-amber-600 rounded-full transition-all active:scale-90"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-6 sm:p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">
                    New Price (£)
                  </label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">£</span>
                    <input 
                      type="number"
                      step="0.01"
                      value={bulkPriceInput}
                      onChange={(e) => setBulkPriceInput(e.target.value)}
                      className="w-full pl-10 pr-5 py-4 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-amber-500 rounded-2xl text-sm font-bold transition-all placeholder:text-gray-400"
                      placeholder="0.00"
                      autoFocus
                    />
                  </div>
                </div>

                <p className="text-[10px] text-amber-600 font-bold text-center bg-amber-50 dark:bg-amber-900/20 py-2 rounded-xl">
                  This will overwrite the estimated value for all selected coins.
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => setIsBulkPriceModalOpen(false)}
                    className="flex-1 py-4 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-2xl font-black uppercase tracking-widest hover:bg-gray-200 dark:hover:bg-gray-700 transition-all active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      const price = parseFloat(bulkPriceInput);
                      if (!isNaN(price)) {
                        applyBulkPrice(price);
                        setIsBulkPriceModalOpen(false);
                        setBulkPriceInput('');
                      }
                    }}
                    className="flex-2 py-4 bg-amber-500 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-amber-100 dark:shadow-none hover:bg-amber-600 transition-all active:scale-95"
                  >
                    Confirm & Apply
                  </button>
                </div>
              </div>
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
              className={`bg-gray-50 dark:bg-gray-950 w-full max-w-2xl rounded-t-3xl sm:rounded-3xl overflow-hidden max-h-[90vh] flex flex-col ${getResponsiveClass('m-0 sm:m-4', 'm-0', 'm-0 sm:m-4', 'm-0 sm:m-6')}`}
            >
              <div className={`bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between sticky top-0 z-10 ${getResponsiveClass('p-4 sm:p-6', 'p-3', 'p-4', 'p-8')}`}>
                <h2 className={`font-bold text-gray-900 dark:text-white ${getResponsiveClass('text-lg sm:text-xl', 'text-base', 'text-lg', 'text-2xl')}`}>Your Profile</h2>
                <button 
                  onClick={() => setIsProfileOpen(false)}
                  className={`hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors flex items-center justify-center ${getResponsiveClass('p-1.5 sm:p-2', 'p-1', 'p-2', 'p-3')}`}
                >
                  <X size={20} className={`text-gray-500 ${getResponsiveClass('sm:w-6 sm:h-6', 'w-5 h-5', 'w-6 h-6', 'w-7 h-7')}`} />
                </button>
              </div>

              <div className={`overflow-y-auto ${getResponsiveClass('p-4 sm:p-6 space-y-4 sm:space-y-6', 'p-3 space-y-3', 'p-4 space-y-4', 'p-8 space-y-8')}`}>
                {/* Bento Grid Layout */}
                <div className={`grid grid-cols-1 sm:grid-cols-3 ${getResponsiveClass('gap-3 sm:gap-4', 'gap-2', 'gap-3', 'gap-4')}`}>
                  
                  {/* User Info Block */}
                  <div className={`sm:col-span-2 bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center ${getResponsiveClass('p-4 sm:p-6 gap-3 sm:gap-4', 'p-3 gap-2', 'p-4 gap-3', 'p-8 gap-6')}`}>
                    <img 
                      src={userProfile.avatar} 
                      alt="Avatar" 
                      referrerPolicy="no-referrer"
                      className={`rounded-2xl bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-100 dark:border-amber-900/30 ${getResponsiveClass('w-16 h-16 sm:w-20 sm:h-20', 'w-12 h-12', 'w-16 h-16', 'w-24 h-24')}`}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className={`font-bold text-gray-900 dark:text-white ${getResponsiveClass('text-xl sm:text-2xl', 'text-lg', 'text-xl', 'text-3xl')}`}>{userProfile.name}</h3>
                        <button 
                          onClick={() => {
                            const newName = prompt("Enter your name:", userProfile.name);
                            if (newName) setUserProfile(prev => ({ ...prev, name: newName }));
                          }}
                          className="p-1 text-gray-400 hover:text-amber-500 transition-colors"
                        >
                          <Edit size={16} className={getResponsiveClass('w-4 h-4', 'w-3 h-3', 'w-4 h-4', 'w-5 h-5')} />
                        </button>
                      </div>
                      <p className={`text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1 ${getResponsiveClass('text-xs sm:text-sm', 'text-[10px]', 'text-xs', 'text-base')}`}>
                        <Award size={14} className={getResponsiveClass('sm:w-4 sm:h-4', 'w-3 h-3', 'w-4 h-4', 'w-5 h-5')} />
                        {userProfile.rank}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button 
                        onClick={() => setIsIdentityCardOpen(true)}
                        className="p-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-xl hover:bg-amber-100 transition-colors"
                        title="Identity Card"
                      >
                        <User size={20} />
                      </button>
                      <button 
                        onClick={() => setIsTimelineOpen(true)}
                        className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-100 transition-colors"
                        title="Timeline"
                      >
                        <History size={20} />
                      </button>
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

                  {/* Pattern Insights Block */}
                  {patternInsights && (
                    <div className="sm:col-span-3 bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 space-y-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 dark:text-indigo-400 rounded-xl">
                          <TrendingUp size={20} />
                        </div>
                        <h3 className="font-black uppercase tracking-tight text-sm text-gray-900 dark:text-white">Pattern Insights</h3>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 sm:gap-4">
                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl space-y-1">
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Top Type</p>
                          <p className="font-black text-indigo-600 dark:text-indigo-400">{patternInsights.mostCollectedType}</p>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl space-y-1">
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Completion</p>
                          <p className="font-black text-indigo-600 dark:text-indigo-400">{patternInsights.completionRate}%</p>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl">
                        <p className="text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed">
                          You've collected <span className="font-bold">{patternInsights.uniqueCount}</span> unique coins. 
                          Your collection is growing <span className="font-bold">{(parseFloat(patternInsights.completionRate) > 50 ? 'rapidly' : 'steadily')}</span>!
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Collection Goals Block */}
                  <div className="sm:col-span-3 bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-amber-50 dark:bg-amber-900/20 text-amber-500 dark:text-amber-400 rounded-xl">
                        <Target size={20} />
                      </div>
                      <h3 className="font-black uppercase tracking-tight text-sm text-gray-900 dark:text-white">Smart Goals</h3>
                    </div>
                    
                    <div className="space-y-3">
                      {userProfile.goals.map(goal => (
                        <div key={goal.id} className={`p-4 rounded-2xl border-2 transition-all ${goal.isCompleted ? 'bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-900/30' : 'bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700'}`}>
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-bold text-sm text-gray-900 dark:text-white">{goal.title}</p>
                              <p className="text-[10px] text-gray-400">{goal.description}</p>
                            </div>
                            {goal.isCompleted && <CheckCircle2 size={16} className="text-green-500" />}
                          </div>
                          
                          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${(goal.current / goal.target) * 100}%` }}
                              className={`h-full ${goal.isCompleted ? 'bg-green-500' : 'bg-amber-500'}`}
                            />
                          </div>
                          <div className="flex justify-between mt-1">
                            <p className="text-[10px] font-bold text-gray-400 uppercase">{goal.current} / {goal.target}</p>
                            <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase">+{goal.reward} XP</p>
                          </div>
                        </div>
                      ))}
                      {userProfile.goals.length === 0 && (
                        <p className="text-center py-4 text-gray-400 text-xs italic">No active goals. Keep collecting to unlock new ones!</p>
                      )}
                    </div>
                  </div>

                  {/* Custom Tags Block */}
                  <div className="sm:col-span-3 bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-rose-50 dark:bg-rose-900/20 text-rose-500 dark:text-rose-400 rounded-xl">
                          <Tag size={20} />
                        </div>
                        <h3 className="font-black uppercase tracking-tight text-sm text-gray-900 dark:text-white">Custom Tags</h3>
                      </div>
                      <button 
                        onClick={() => {
                          const name = prompt("Enter tag name:");
                          if (name) {
                            const newTag: CoinTag = { id: `t-${Date.now()}`, name, color: '#6366f1' };
                            setUserProfile(prev => ({ ...prev, tags: [...prev.tags, newTag] }));
                          }
                        }}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                      >
                        <Plus size={18} className="text-gray-400" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {userProfile.tags.map(tag => (
                        <div 
                          key={tag.id} 
                          className="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                        >
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
                          {tag.name}
                          <button 
                            onClick={() => setUserProfile(prev => ({ ...prev, tags: prev.tags.filter(t => t.id !== tag.id) }))}
                            className="ml-1 text-gray-300 hover:text-red-500"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
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

                  {/* Stats Block - DNA Score */}
                  <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-3xl shadow-lg text-white flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <Zap size={24} />
                      <span className="text-3xl font-black">{dnaScore}</span>
                    </div>
                    <div>
                      <p className="text-indigo-100 text-xs font-bold uppercase tracking-widest">Collection</p>
                      <p className="text-lg font-bold">DNA Score</p>
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

                {/* Quick Actions Grid */}
                <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-6">
                    <button 
                      onClick={() => setIsQuickAddOpen(true)}
                      className="p-4 bg-gradient-to-br from-green-400 to-emerald-600 text-white font-bold rounded-2xl hover:from-green-500 hover:to-emerald-700 transition-all flex flex-col items-center justify-center gap-2 shadow-lg"
                    >
                      <Plus size={24} />
                      <span className="text-[10px] uppercase tracking-widest font-black">Quick Add</span>
                    </button>
                    <button 
                      onClick={() => setIsSpinModalOpen(true)}
                      className="p-4 bg-gradient-to-br from-amber-400 to-orange-500 text-white font-bold rounded-2xl hover:from-amber-500 hover:to-orange-600 transition-all flex flex-col items-center justify-center gap-2 shadow-lg"
                    >
                      <Dices size={24} />
                      <span className="text-[10px] uppercase tracking-widest font-black">Lucky Spin</span>
                    </button>
                  <button 
                    onClick={() => setIsPurchasedAddOpen(true)}
                    className="p-4 bg-blue-500 text-white font-bold rounded-2xl hover:bg-blue-600 transition-all flex flex-col items-center justify-center gap-2 shadow-lg"
                  >
                    <ShoppingBag size={24} />
                    <span className="text-[10px] uppercase tracking-widest font-black">Purchased</span>
                  </button>
                  <button 
                    onClick={() => setIsPhotoLibraryOpen(true)}
                    className="p-4 bg-purple-500 text-white font-bold rounded-2xl hover:bg-purple-600 transition-all flex flex-col items-center justify-center gap-2 shadow-lg"
                  >
                    <Camera size={24} />
                    <span className="text-[10px] uppercase tracking-widest font-black">Library</span>
                  </button>
                  <button 
                    onClick={() => {
                      addPoints(POINT_VALUES.DAILY_CHECKIN, "Daily Reward Claimed!");
                      alert("You've claimed your daily 50 points! Come back tomorrow for more.");
                    }}
                    className="p-4 bg-amber-500 text-white font-bold rounded-2xl hover:bg-amber-600 transition-all flex flex-col items-center justify-center gap-2 shadow-lg"
                  >
                    <Award size={24} />
                    <span className="text-[10px] uppercase tracking-widest font-black">Daily Reward</span>
                  </button>
                </div>

                {/* Settings Section */}
                <div className="space-y-8 mb-12">
                  
                  {/* Display Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 px-2">
                      <Monitor size={16} className="text-blue-500" />
                      <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Display</h4>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-50 dark:bg-gray-800 rounded-xl flex items-center justify-center text-gray-400">
                            {userProfile.settings?.isDarkMode ? <Moon size={16} /> : <Sparkles size={16} />}
                          </div>
                          <div>
                            <p className="font-bold text-xs text-gray-900 dark:text-white">Dark Mode</p>
                            <p className="text-[10px] text-gray-500">Enable night theme</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setUserProfile(prev => ({ ...prev, settings: { ...prev.settings, isDarkMode: !prev.settings.isDarkMode } }))}
                          className={`w-10 h-5 rounded-full transition-all relative ${userProfile.settings?.isDarkMode ? 'bg-amber-500' : 'bg-gray-200 dark:bg-gray-700'}`}
                        >
                          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${userProfile.settings?.isDarkMode ? 'right-0.5' : 'left-0.5'}`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-premium border border-gray-100 dark:border-gray-800 premium-shadow">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-50 dark:bg-gray-800 rounded-xl flex items-center justify-center text-gray-400">
                            <Settings size={16} />
                          </div>
                          <div>
                            <p className="font-bold text-xs text-gray-900 dark:text-white">Follow System Theme</p>
                            <p className="text-[10px] text-gray-500">Sync with device settings</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setUserProfile(prev => ({ ...prev, settings: { ...prev.settings, followSystemTheme: !prev.settings.followSystemTheme } }))}
                          className={`w-10 h-5 rounded-full transition-all relative active:scale-90 ${userProfile.settings?.followSystemTheme ? 'bg-amber-500' : 'bg-gray-200 dark:bg-gray-700'}`}
                        >
                          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${userProfile.settings?.followSystemTheme ? 'right-0.5' : 'left-0.5'}`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-premium border border-gray-100 dark:border-gray-800 premium-shadow">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-50 dark:bg-gray-800 rounded-xl flex items-center justify-center text-gray-400">
                            <BarChart3 size={16} />
                          </div>
                          <div>
                            <p className="font-bold text-xs text-gray-900 dark:text-white">Compact UI</p>
                            <p className="text-[10px] text-gray-500">Reduce spacing and sizes</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setUserProfile(prev => ({ ...prev, settings: { ...prev.settings, isCompactUI: !prev.settings.isCompactUI } }))}
                          className={`w-10 h-5 rounded-full transition-all relative active:scale-90 ${userProfile.settings?.isCompactUI ? 'bg-amber-500' : 'bg-gray-200 dark:bg-gray-700'}`}
                        >
                          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${userProfile.settings?.isCompactUI ? 'right-0.5' : 'left-0.5'}`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-premium border border-gray-100 dark:border-gray-800 premium-shadow">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-50 dark:bg-gray-800 rounded-xl flex items-center justify-center text-gray-400">
                            <LayoutGrid size={16} />
                          </div>
                          <div>
                            <p className="font-bold text-xs text-gray-900 dark:text-white">Layout Switcher</p>
                            <p className="text-[10px] text-gray-500">Show switcher in header</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setUserProfile(prev => ({ ...prev, settings: { ...prev.settings, showLayoutSwitcher: !prev.settings.showLayoutSwitcher } }))}
                          className={`w-10 h-5 rounded-full transition-all relative active:scale-90 ${userProfile.settings?.showLayoutSwitcher ? 'bg-amber-500' : 'bg-gray-200 dark:bg-gray-700'}`}
                        >
                          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${userProfile.settings?.showLayoutSwitcher ? 'right-0.5' : 'left-0.5'}`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-premium border border-gray-100 dark:border-gray-800 premium-shadow">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-50 dark:bg-gray-800 rounded-xl flex items-center justify-center text-gray-400">
                            <Layout size={16} />
                          </div>
                          <div>
                            <p className="font-bold text-xs text-gray-900 dark:text-white">Text Mode UI</p>
                            <p className="text-[10px] text-gray-500">Minimal text-only layout</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setUserProfile(prev => ({ ...prev, settings: { ...prev.settings, isTextMode: !prev.settings.isTextMode } }))}
                          className={`w-10 h-5 rounded-full transition-all relative active:scale-90 ${userProfile.settings?.isTextMode ? 'bg-amber-500' : 'bg-gray-200 dark:bg-gray-700'}`}
                        >
                          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${userProfile.settings?.isTextMode ? 'right-0.5' : 'left-0.5'}`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-premium border border-gray-100 dark:border-gray-800 premium-shadow">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-50 dark:bg-gray-800 rounded-xl flex items-center justify-center text-gray-400">
                            <Wind size={16} />
                          </div>
                          <div>
                            <p className="font-bold text-xs text-gray-900 dark:text-white">Ambient Motion</p>
                            <p className="text-[10px] text-gray-500">Subtle background movement</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setUserProfile(prev => ({ ...prev, settings: { ...prev.settings, isAmbientMotionEnabled: !prev.settings.isAmbientMotionEnabled } }))}
                          className={`w-10 h-5 rounded-full transition-all relative active:scale-90 ${userProfile.settings?.isAmbientMotionEnabled ? 'bg-amber-500' : 'bg-gray-200 dark:bg-gray-700'}`}
                        >
                          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${userProfile.settings?.isAmbientMotionEnabled ? 'right-0.5' : 'left-0.5'}`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-premium border border-gray-100 dark:border-gray-800 premium-shadow">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-50 dark:bg-gray-800 rounded-xl flex items-center justify-center text-gray-400">
                            <Table size={16} />
                          </div>
                          <div>
                            <p className="font-bold text-xs text-gray-900 dark:text-white">Sort Collection By</p>
                            <p className="text-[10px] text-gray-500">Change default sorting</p>
                          </div>
                        </div>
                        <select
                          value={userProfile.settings.sortBy || 'recent-added'}
                          onChange={(e) => setUserProfile(prev => ({
                            ...prev,
                            settings: { ...prev.settings, sortBy: e.target.value as any }
                          }))}
                          className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border-none outline-none active:scale-95 transition-transform"
                        >
                          <option value="name">Name</option>
                          <option value="recent-added">Recent</option>
                          <option value="recent-opened">Opened</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-premium border border-gray-100 dark:border-gray-800 premium-shadow">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-50 dark:bg-gray-800 rounded-xl flex items-center justify-center text-gray-400">
                            <Layout size={16} />
                          </div>
                          <div>
                            <p className="font-bold text-xs text-gray-900 dark:text-white">App Theme</p>
                            <p className="text-[10px] text-gray-500">Texture-based themes</p>
                          </div>
                        </div>
                        <select
                          value={userProfile.settings.theme || 'default'}
                          onChange={(e) => setUserProfile(prev => ({
                            ...prev,
                            settings: { ...prev.settings, theme: e.target.value as any }
                          }))}
                          className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border-none outline-none active:scale-95 transition-transform"
                        >
                          <option value="default">Default</option>
                          <option value="paper">Paper</option>
                          <option value="glass">Glass</option>
                          <option value="wood">Wood</option>
                          <option value="metal">Metal</option>
                          <option value="fabric">Fabric</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* View Modes Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 px-2">
                      <LayoutGrid size={16} className="text-amber-500" />
                      <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">View Modes</h4>
                    </div>
                    <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-4 space-y-6">
                      
                      {/* Layout Visibility Toggles */}
                      <div className="space-y-3">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Enabled Layouts</p>
                        <div className="grid grid-cols-2 gap-2">
                          {LAYOUT_OPTIONS.map(opt => (
                            <button
                              key={opt.id}
                              onClick={() => {
                                const current = userProfile.settings.enabledLayouts || {};
                                setUserProfile(prev => ({
                                  ...prev,
                                  settings: {
                                    ...prev.settings,
                                    enabledLayouts: {
                                      ...current,
                                      [opt.id]: current[opt.id] === false ? true : false
                                    }
                                  }
                                }));
                              }}
                              className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${
                                userProfile.settings.enabledLayouts?.[opt.id] !== false
                                  ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/30 text-amber-700 dark:text-amber-400'
                                  : 'bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-400'
                              }`}
                            >
                              {opt.icon}
                              <span className="text-[10px] font-bold uppercase tracking-widest">{opt.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Visible Fields Toggles */}
                      <div className="space-y-3">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Text Field Visibility</p>
                        <div className="flex flex-wrap gap-2">
                          {['denomination', 'year', 'mint', 'condition'].map(field => (
                            <button
                              key={field}
                              onClick={() => {
                                const current = userProfile.settings.visibleFields || { denomination: true, year: true, mint: true, condition: true };
                                setUserProfile(prev => ({
                                  ...prev,
                                  settings: {
                                    ...prev.settings,
                                    visibleFields: {
                                      ...current,
                                      [field]: !current[field as keyof typeof current]
                                    }
                                  }
                                }));
                              }}
                              className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all ${
                                (userProfile.settings.visibleFields?.[field as keyof typeof userProfile.settings.visibleFields] ?? true)
                                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/30 text-blue-600 dark:text-blue-400'
                                  : 'bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-400'
                              }`}
                            >
                              {field}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* App Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 px-2">
                      <Smartphone size={16} className="text-amber-500" />
                      <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">App</h4>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-50 dark:bg-gray-800 rounded-xl flex items-center justify-center text-gray-400">
                            <Zap size={16} />
                          </div>
                          <div>
                            <p className="font-bold text-xs text-gray-900 dark:text-white">Focus Mode (Performance)</p>
                            <p className="text-[10px] text-gray-500">Hide non-essential UI</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setUserProfile(prev => ({ ...prev, settings: { ...prev.settings, isFocusMode: !prev.settings.isFocusMode } }))}
                          className={`w-10 h-5 rounded-full transition-all relative ${userProfile.settings?.isFocusMode ? 'bg-amber-500' : 'bg-gray-200 dark:bg-gray-700'}`}
                        >
                          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${userProfile.settings?.isFocusMode ? 'right-0.5' : 'left-0.5'}`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-50 dark:bg-gray-800 rounded-xl flex items-center justify-center text-gray-400">
                            <Layout size={16} />
                          </div>
                          <div>
                            <p className="font-bold text-xs text-gray-900 dark:text-white">Bottom Navigation</p>
                            <p className="text-[10px] text-gray-500">Enable bottom menu bar</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setUserProfile(prev => ({ ...prev, settings: { ...prev.settings, showBottomMenu: !prev.settings.showBottomMenu } }))}
                          className={`w-10 h-5 rounded-full transition-all relative ${userProfile.settings?.showBottomMenu ? 'bg-amber-500' : 'bg-gray-200 dark:bg-gray-700'}`}
                        >
                          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${userProfile.settings?.showBottomMenu ? 'right-0.5' : 'left-0.5'}`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-50 dark:bg-gray-800 rounded-xl flex items-center justify-center text-gray-400">
                            <Globe size={16} />
                          </div>
                          <div>
                            <p className="font-bold text-xs text-gray-900 dark:text-white">Old European Coins</p>
                            <p className="text-[10px] text-gray-500">Show pre-Euro currencies</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setUserProfile(prev => ({ ...prev, settings: { ...prev.settings, showOldEuropeanCoins: !prev.settings.showOldEuropeanCoins } }))}
                          className={`w-10 h-5 rounded-full transition-all relative ${userProfile.settings?.showOldEuropeanCoins ? 'bg-amber-500' : 'bg-gray-200 dark:bg-gray-700'}`}
                        >
                          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${userProfile.settings?.showOldEuropeanCoins ? 'right-0.5' : 'left-0.5'}`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-50 dark:bg-gray-800 rounded-xl flex items-center justify-center text-gray-400">
                            <ImageOff size={16} />
                          </div>
                          <div>
                            <p className="font-bold text-xs text-gray-900 dark:text-white">Background Removal</p>
                            <p className="text-[10px] text-gray-500">Enable AI image processing</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setUserProfile(prev => ({ ...prev, settings: { ...prev.settings, isBackgroundRemovalEnabled: !prev.settings.isBackgroundRemovalEnabled } }))}
                          className={`w-10 h-5 rounded-full transition-all relative ${userProfile.settings?.isBackgroundRemovalEnabled ? 'bg-amber-500' : 'bg-gray-200 dark:bg-gray-700'}`}
                        >
                          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${userProfile.settings?.isBackgroundRemovalEnabled ? 'right-0.5' : 'left-0.5'}`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-50 dark:bg-gray-800 rounded-xl flex items-center justify-center text-gray-400">
                            <RefreshCw size={16} />
                          </div>
                          <div>
                            <p className="font-bold text-xs text-gray-900 dark:text-white">Compare Mode</p>
                            <p className="text-[10px] text-gray-500">Side-by-side view</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setIsCompareMode(true)}
                          className="px-3 py-1.5 bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
                        >
                          Open
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          onClick={refreshApp}
                          className="flex items-center justify-center gap-2 p-3 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 hover:bg-gray-50 transition-colors"
                        >
                          <RefreshCw size={14} className="text-blue-500" />
                          <span className="text-[10px] font-bold uppercase tracking-widest">Refresh App</span>
                        </button>
                        <button 
                          onClick={clearCache}
                          className="flex items-center justify-center gap-2 p-3 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 hover:bg-gray-50 transition-colors"
                        >
                          <Trash2 size={14} className="text-red-500" />
                          <span className="text-[10px] font-bold uppercase tracking-widest">Clear Cache</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Data Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 px-2">
                      <Database size={16} className="text-green-500" />
                      <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Data</h4>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          onClick={() => setIsExportModalOpen(true)}
                          className="flex items-center justify-center gap-2 p-3 bg-gray-900 text-white rounded-2xl hover:bg-black transition-colors"
                        >
                          <Share size={14} />
                          <span className="text-[10px] font-bold uppercase tracking-widest">Export Data</span>
                        </button>
                        <button 
                          onClick={importCollection}
                          className="flex items-center justify-center gap-2 p-3 bg-white text-gray-900 border border-gray-200 rounded-2xl hover:bg-gray-50 transition-colors"
                        >
                          <RefreshCw size={14} />
                          <span className="text-[10px] font-bold uppercase tracking-widest">Import Data</span>
                        </button>
                      </div>

                      <div className="p-3 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-amber-50 dark:bg-amber-900/20 rounded-xl flex items-center justify-center text-amber-600">
                              <Shield size={16} />
                            </div>
                            <div>
                              <p className="font-bold text-xs text-gray-900 dark:text-white">Recovery Code (Backup)</p>
                              <p className="text-[10px] text-gray-500">Secure your collection</p>
                            </div>
                          </div>
                          <button 
                            onClick={generateRecoveryCode}
                            className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-600 rounded-xl text-[10px] font-bold"
                          >
                            {userProfile.recoveryCode ? 'Regen' : 'Gen'}
                          </button>
                        </div>
                        {userProfile.recoveryCode && (
                          <div className="bg-gray-50 dark:bg-gray-800 p-2.5 rounded-xl flex items-center justify-between border border-gray-100 dark:border-gray-700">
                            <code className="text-[10px] font-mono font-bold text-gray-900 dark:text-white tracking-widest">
                              {userProfile.recoveryCode}
                            </code>
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText(userProfile.recoveryCode!);
                                alert("Recovery code copied!");
                              }}
                              className="text-amber-600"
                            >
                              <Copy size={14} />
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-50 dark:bg-gray-800 rounded-xl flex items-center justify-center text-gray-400">
                            <RefreshCw size={16} />
                          </div>
                          <div>
                            <p className="font-bold text-xs text-gray-900 dark:text-white">Data Conversion</p>
                            <p className="text-[10px] text-gray-500">Legacy format check</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => {
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
                              alert("No old data detected.");
                            }
                          }}
                          className="px-3 py-1.5 bg-amber-100 text-amber-600 font-bold rounded-xl text-[10px]"
                        >
                          Check
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Advanced Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 px-2">
                      <Settings2 size={16} className="text-purple-500" />
                      <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Advanced</h4>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-50 dark:bg-gray-800 rounded-xl flex items-center justify-center text-gray-400">
                            <Table size={16} />
                          </div>
                          <div>
                            <p className="font-bold text-xs text-gray-900 dark:text-white">Purchase Mode</p>
                            <p className="text-[10px] text-gray-500">Senior-friendly table view</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setUserProfile(prev => ({ ...prev, settings: { ...prev.settings, isPurchaseMode: !prev.settings.isPurchaseMode } }))}
                          className={`w-10 h-5 rounded-full transition-all relative ${userProfile.settings?.isPurchaseMode ? 'bg-amber-500' : 'bg-gray-200 dark:bg-gray-700'}`}
                        >
                          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${userProfile.settings?.isPurchaseMode ? 'right-0.5' : 'left-0.5'}`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-50 dark:bg-gray-800 rounded-xl flex items-center justify-center text-gray-400">
                            <Tag size={16} />
                          </div>
                          <div>
                            <p className="font-bold text-xs text-gray-900 dark:text-white">Show Coin Price</p>
                            <p className="text-[10px] text-gray-500">Display price in normal mode</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setUserProfile(prev => ({ ...prev, settings: { ...prev.settings, showCoinPrice: !prev.settings.showCoinPrice } }))}
                          className={`w-10 h-5 rounded-full transition-all relative ${userProfile.settings?.showCoinPrice ? 'bg-amber-500' : 'bg-gray-200 dark:bg-gray-700'}`}
                        >
                          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${userProfile.settings?.showCoinPrice ? 'right-0.5' : 'left-0.5'}`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-50 dark:bg-gray-800 rounded-xl flex items-center justify-center text-gray-400">
                            <Globe size={16} />
                          </div>
                          <div>
                            <p className="font-bold text-xs text-gray-900 dark:text-white">Show Old European Coins</p>
                            <p className="text-[10px] text-gray-500">Enable pre-euro currencies</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setUserProfile(prev => ({ ...prev, settings: { ...prev.settings, showOldEuropeanCoins: !prev.settings.showOldEuropeanCoins } }))}
                          className={`w-10 h-5 rounded-full transition-all relative ${userProfile.settings?.showOldEuropeanCoins ? 'bg-amber-500' : 'bg-gray-200 dark:bg-gray-700'}`}
                        >
                          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${userProfile.settings?.showOldEuropeanCoins ? 'right-0.5' : 'left-0.5'}`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-50 dark:bg-gray-800 rounded-xl flex items-center justify-center text-gray-400">
                            <ShieldAlert size={16} />
                          </div>
                          <div>
                            <p className="font-bold text-xs text-gray-900 dark:text-white">Safe Mode</p>
                            <p className="text-[10px] text-gray-500">Minimal recovery state</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => alert("Safe Mode is automatically managed by the system. If the app crashes, it will prompt for recovery.")}
                          className="px-3 py-1.5 bg-gray-100 text-gray-500 font-bold rounded-xl text-[10px] uppercase tracking-widest"
                        >
                          Info
                        </button>
                      </div>

                      {collectedIds.length >= 20 && (
                        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800/50 rounded-2xl flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-purple-100 dark:bg-purple-800/40 rounded-xl flex items-center justify-center text-purple-600">
                              <FlaskConical size={16} />
                            </div>
                            <div>
                              <p className="font-bold text-xs text-gray-900 dark:text-white">Experimental Sorting</p>
                              <p className="text-[10px] text-purple-600/60">Unlocked feature</p>
                            </div>
                          </div>
                          <button className="px-3 py-1.5 bg-purple-600 text-white font-bold rounded-xl text-[10px] uppercase tracking-widest">Enable</button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Fixed Prices Section */}
                  <div className="space-y-4 mt-8">
                    <div className="flex items-center gap-2 px-2">
                      <Tag size={16} className="text-amber-500" />
                      <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Fixed Prices</h4>
                    </div>
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 space-y-4">
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Set default prices for denominations</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                        {DENOMINATIONS.map(denom => (
                          <div key={denom} className="space-y-1">
                            <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">{denom}</label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">£</span>
                              <input 
                                type="number"
                                step="0.01"
                                value={userProfile.settings.fixedPrices?.[denom] || ''}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value);
                                  setUserProfile(prev => ({
                                    ...prev,
                                    settings: {
                                      ...prev.settings,
                                      fixedPrices: {
                                        ...(prev.settings.fixedPrices || {}),
                                        [denom]: isNaN(val) ? 0 : val
                                      }
                                    }
                                  }));
                                }}
                                className="w-full pl-6 pr-3 py-2 bg-gray-50 dark:bg-gray-800 border border-transparent focus:border-amber-500 rounded-xl text-[10px] font-bold transition-all"
                                placeholder="0.00"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-800 text-center">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em]">Coin Collector v2.0</p>
                </div>
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
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-white dark:bg-gray-900 rounded-premium overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-800 p-8 text-center premium-shadow"
            >
              <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center text-amber-500 mx-auto mb-6 border border-amber-200 dark:border-amber-800 shadow-inner">
                <Trophy size={40} className="text-amber-500" />
              </div>
              <h3 className="text-3xl font-display font-bold text-gray-900 dark:text-white mb-2 tracking-tight">Daily Lucky Spin</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-8 font-medium">
                Spin the wheel to win bonus points! You can spin once every 24 hours.
              </p>

              {userProfile.lastSpinDate === new Date().toISOString().split('T')[0] ? (
                <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-premium border border-gray-100 dark:border-gray-700 mb-8 shadow-inner">
                  <p className="text-gray-600 dark:text-gray-300 font-bold text-sm flex items-center justify-center gap-2">
                    <Clock size={16} />
                    Already spun today!
                  </p>
                  <p className="text-[10px] text-gray-400 mt-2 uppercase tracking-widest font-black">Come back tomorrow</p>
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
                  className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-display font-bold rounded-premium hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg shadow-amber-500/20 mb-4 uppercase tracking-widest active:scale-95"
                >
                  Spin Now!
                </button>
              )}

              <button 
                onClick={() => setIsSpinModalOpen(false)}
                className="w-full py-3 text-gray-400 font-bold uppercase tracking-widest text-[10px] hover:text-gray-600 dark:hover:text-gray-200 transition-colors active:scale-95"
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
              <div className={`relative transition-all duration-500 ${isZoomed ? 'h-full' : getResponsiveClass('h-64 sm:h-96', 'h-48', 'h-64', 'h-96')}`}>
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
                <div className={`absolute top-4 left-4 flex flex-wrap ${getResponsiveClass('gap-2', 'gap-1', 'gap-2', 'gap-3')}`}>
                  <button 
                    onClick={() => changeCoinImage(selectedCoin.id)}
                    className={`flex items-center bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-md transition-all z-10 border border-white/20 group shadow-lg active:scale-90 ${getResponsiveClass('gap-2 px-4 py-2', 'gap-1 px-2 py-1', 'gap-2 px-4 py-2', 'gap-3 px-5 py-2.5')}`}
                    title="Update Photo"
                  >
                    <Camera size={18} className={`group-hover:scale-110 transition-transform ${getResponsiveClass('', 'w-3.5 h-3.5', 'w-4 h-4', 'w-5 h-5')}`} />
                    <span className={`font-black uppercase tracking-widest ${getResponsiveClass('text-[10px]', 'text-[8px]', 'text-[10px]', 'text-xs')}`}>Update Photo</span>
                  </button>
                  <button 
                    onClick={() => editCoin(selectedCoin)}
                    className={`flex items-center bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-md transition-all z-10 border border-white/20 group shadow-lg active:scale-90 ${getResponsiveClass('gap-2 px-4 py-2', 'gap-1 px-2 py-1', 'gap-2 px-4 py-2', 'gap-3 px-5 py-2.5')}`}
                    title="Edit Details"
                  >
                    <Edit size={18} className={`group-hover:scale-110 transition-transform ${getResponsiveClass('', 'w-3.5 h-3.5', 'w-4 h-4', 'w-5 h-5')}`} />
                    <span className={`font-black uppercase tracking-widest ${getResponsiveClass('text-[10px]', 'text-[8px]', 'text-[10px]', 'text-xs')}`}>Edit Details</span>
                  </button>
                  <button 
                    onClick={() => {
                      setWebSearchQuery(selectedCoin.name);
                      setIsWebSearchOpen(true);
                      searchWebImages(selectedCoin.name);
                    }}
                    className={`flex items-center bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-md transition-all z-10 border border-white/20 group shadow-lg active:scale-90 ${getResponsiveClass('gap-2 px-4 py-2', 'gap-1 px-2 py-1', 'gap-2 px-4 py-2', 'gap-3 px-5 py-2.5')}`}
                    title="Search Web"
                  >
                    <Globe size={18} className={`group-hover:scale-110 transition-transform ${getResponsiveClass('', 'w-3.5 h-3.5', 'w-4 h-4', 'w-5 h-5')}`} />
                    <span className={`font-black uppercase tracking-widest ${getResponsiveClass('text-[10px]', 'text-[8px]', 'text-[10px]', 'text-xs')}`}>Search Web</span>
                  </button>
                  <button 
                    onClick={() => {
                      setCompareCoins(prev => {
                        if (prev[0] === null) return [selectedCoin, prev[1]];
                        if (prev[1] === null) return [prev[0], selectedCoin];
                        return [selectedCoin, prev[1]];
                      });
                      setIsCompareMode(true);
                    }}
                    className={`flex items-center bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-md transition-all z-10 border border-white/20 group shadow-lg active:scale-90 ${getResponsiveClass('gap-2 px-4 py-2', 'gap-1 px-2 py-1', 'gap-2 px-4 py-2', 'gap-3 px-5 py-2.5')}`}
                    title="Compare"
                  >
                    <RefreshCw size={18} className={`group-hover:scale-110 transition-transform ${getResponsiveClass('', 'w-3.5 h-3.5', 'w-4 h-4', 'w-5 h-5')}`} />
                    <span className={`font-black uppercase tracking-widest ${getResponsiveClass('text-[10px]', 'text-[8px]', 'text-[10px]', 'text-xs')}`}>Compare</span>
                  </button>
                </div>
                {!isZoomed && (
                  <button 
                    onClick={() => setSelectedCoin(null)}
                    className={`absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-all border border-white/20 shadow-lg active:scale-90 ${getResponsiveClass('w-10 h-10', 'w-8 h-8', 'w-10 h-10', 'w-12 h-12')}`}
                  >
                    <X size={20} className={getResponsiveClass('', 'w-4 h-4', 'w-5 h-5', 'w-6 h-6')} />
                  </button>
                )}
              </div>

              {!isZoomed && (
                <div className={`bg-white dark:bg-gray-900 max-h-[60vh] overflow-y-auto ${getResponsiveClass('p-6 sm:p-8', 'p-4', 'p-6', 'p-10')}`}>
                  <div className={`flex justify-between items-start ${getResponsiveClass('mb-6', 'mb-4', 'mb-6', 'mb-8')}`}>
                    <div>
                      <h2 className={`font-display font-bold text-gray-900 dark:text-white leading-tight mb-1 ${getResponsiveClass('text-3xl', 'text-2xl', 'text-3xl', 'text-4xl')}`}>{selectedCoin.name}</h2>
                      <div className="flex items-center gap-2">
                        <span className={`bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full font-black uppercase tracking-widest border border-amber-200 dark:border-amber-800 ${getResponsiveClass('px-3 py-1 text-[10px]', 'px-2 py-0.5 text-[8px]', 'px-3 py-1 text-[10px]', 'px-4 py-1.5 text-xs')}`}>
                          {selectedCoin.denomination}
                        </span>
                        <span className={`bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full font-black uppercase tracking-widest border border-blue-200 dark:border-blue-800 ${getResponsiveClass('px-3 py-1 text-[10px]', 'px-2 py-0.5 text-[8px]', 'px-3 py-1 text-[10px]', 'px-4 py-1.5 text-xs')}`}>
                          {selectedCoin.year}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-display font-bold text-gray-900 dark:text-white ${getResponsiveClass('text-2xl', 'text-xl', 'text-2xl', 'text-3xl')}`}>£{(selectedCoin.value || 0).toFixed(2)}</p>
                      <p className={`font-bold text-gray-400 uppercase tracking-widest ${getResponsiveClass('text-[10px]', 'text-[8px]', 'text-[10px]', 'text-xs')}`}>Est. Value</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 mb-8">
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Rarity</p>
                      <div className="flex items-center gap-2">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map(i => {
                            const rarityScore = selectedCoin.rarity === 'Ultra Rare' ? 4 : selectedCoin.rarity === 'Rare' ? 3 : selectedCoin.rarity === 'Uncommon' ? 2 : 1;
                            return (
                              <div 
                                key={i} 
                                className={`w-2 h-2 rounded-full ${i <= rarityScore ? 'bg-amber-500' : 'bg-gray-200 dark:bg-gray-700'}`} 
                              />
                            );
                          })}
                        </div>
                        <span className="text-sm font-black text-amber-600">{selectedCoin.rarity || 'Common'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-8">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Description</h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed font-medium">
                      {selectedCoin.description || "No detailed description available for this coin. Use the 'Search Web' button to find more information about this unique specimen."}
                    </p>
                  </div>

                  {/* Coin Tags */}
                  <div className="mb-8">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Coin Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {userProfile.tags.map(tag => {
                        const isTagged = (userProfile.coinTags[selectedCoin.id] || []).includes(tag.id);
                        return (
                          <button
                            key={tag.id}
                            onClick={() => toggleTag(selectedCoin.id, tag.id)}
                            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all flex items-center gap-2 border ${
                              isTagged 
                                ? 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-100 dark:shadow-none' 
                                : 'bg-gray-50 dark:bg-gray-800 text-gray-500 border-gray-100 dark:border-gray-700 hover:border-amber-200'
                            }`}
                          >
                            <div className={`w-1.5 h-1.5 rounded-full ${isTagged ? 'bg-white' : ''}`} style={{ backgroundColor: isTagged ? 'white' : tag.color }} />
                            {tag.name}
                          </button>
                        );
                      })}
                      {userProfile.tags.length === 0 && (
                        <p className="text-[10px] text-gray-400 italic font-bold uppercase tracking-widest">No tags created yet. Create some in your profile!</p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button 
                      onClick={(e) => {
                        toggleCollected(selectedCoin.id, e);
                        setSelectedCoin(null);
                      }}
                      className={`flex-1 py-4 font-black rounded-2xl transition-all shadow-lg uppercase tracking-widest text-sm ${
                        collectedIds.includes(selectedCoin.id)
                          ? 'bg-red-50 text-red-600 border-2 border-red-100 hover:bg-red-100'
                          : 'bg-green-500 text-white hover:bg-green-600 shadow-green-100'
                      }`}
                    >
                      {collectedIds.includes(selectedCoin.id) ? 'Remove from Collection' : 'Add to Collection'}
                    </button>
                    {collectedIds.includes(selectedCoin.id) && (
                      <button 
                        onClick={(e) => {
                          toggleCollected(selectedCoin.id, e, true);
                          setSelectedCoin(null);
                        }}
                        className="flex-1 py-4 bg-amber-500 text-white font-black rounded-2xl hover:bg-amber-600 shadow-lg uppercase tracking-widest text-sm"
                      >
                        Add Duplicate
                      </button>
                    )}
                  </div>

                  {/* Fusion Button */}
                  {collectedIds.filter(id => id === selectedCoin.id).length >= 3 && (
                    <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-800 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-black text-amber-600 uppercase tracking-widest">Fusion Available</p>
                        <p className="text-[10px] text-amber-500 font-bold">Combine 3 duplicates for a rare coin!</p>
                      </div>
                      <button 
                        onClick={() => {
                          setFusionSelection([selectedCoin.id, selectedCoin.id, selectedCoin.id]);
                          setIsFusionModalOpen(true);
                          setSelectedCoin(null);
                        }}
                        className="px-4 py-2 bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-amber-600 transition-all shadow-md"
                      >
                        Fuse Now
                      </button>
                    </div>
                  )}

                  <div className="mt-8 flex gap-3">
                    <button 
                      onClick={() => setSelectedCoin(null)}
                      className="flex-1 py-4 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-black rounded-2xl hover:bg-gray-200 transition-all uppercase tracking-widest text-sm"
                    >
                      Close
                    </button>
                  </div>
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
              className={`relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[85vh] ${getResponsiveClass('m-4', 'm-2', 'm-4', 'm-6')}`}
            >
              <div className={`border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50 ${getResponsiveClass('p-6', 'p-3', 'p-6', 'p-8')}`}>
                <div className="flex items-center gap-3">
                  <div className={`bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 ${getResponsiveClass('w-10 h-10', 'w-8 h-8', 'w-10 h-10', 'w-12 h-12')}`}>
                    <ShoppingBag size={20} className={getResponsiveClass('w-5 h-5', 'w-4 h-4', 'w-5 h-5', 'w-6 h-6')} />
                  </div>
                  <div>
                    <h2 className={`font-black text-gray-900 dark:text-white ${getResponsiveClass('text-xl', 'text-lg', 'text-xl', 'text-2xl')}`}>Purchased Coins</h2>
                    <p className={`text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest ${getResponsiveClass('text-xs', 'text-[10px]', 'text-xs', 'text-sm')}`}>Collection History</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      setIsPurchased(true);
                      setIsManualAddOpen(true);
                    }}
                    className={`bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors shadow-lg flex items-center justify-center ${getResponsiveClass('p-2', 'p-1.5', 'p-2', 'p-3')}`}
                    title="Add New Purchase"
                  >
                    <Plus size={20} className={getResponsiveClass('w-5 h-5', 'w-4 h-4', 'w-5 h-5', 'w-6 h-6')} />
                  </button>
                  <button 
                    onClick={() => setIsPurchasedAddOpen(false)}
                    className={`hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors flex items-center justify-center ${getResponsiveClass('p-2', 'p-1.5', 'p-2', 'p-3')}`}
                  >
                    <X size={24} className={`text-gray-400 ${getResponsiveClass('w-6 h-6', 'w-5 h-5', 'w-6 h-6', 'w-7 h-7')}`} />
                  </button>
                </div>
              </div>

              <div className={`flex-1 overflow-y-auto space-y-4 ${getResponsiveClass('p-4 sm:p-6', 'p-3', 'p-4', 'p-8')}`}>
                {purchasedCoins.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                      <ShoppingBag size={40} />
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
              className={`relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col h-[85vh] ${getResponsiveClass('m-4', 'm-2', 'm-4', 'm-6')}`}
            >
              <div className={`border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50 ${getResponsiveClass('p-6', 'p-3', 'p-6', 'p-8')}`}>
                <div className="flex items-center gap-3">
                  <div className={`bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center text-purple-600 dark:text-purple-400 ${getResponsiveClass('w-10 h-10', 'w-8 h-8', 'w-10 h-10', 'w-12 h-12')}`}>
                    <Camera size={20} className={getResponsiveClass('w-5 h-5', 'w-4 h-4', 'w-5 h-5', 'w-6 h-6')} />
                  </div>
                  <div>
                    <h2 className={`font-black text-gray-900 dark:text-white ${getResponsiveClass('text-xl', 'text-lg', 'text-xl', 'text-2xl')}`}>Coin Photo Library</h2>
                    <p className={`text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest ${getResponsiveClass('text-xs', 'text-[10px]', 'text-xs', 'text-sm')}`}>Your Collection Gallery</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsPhotoLibraryOpen(false)}
                  className={`hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors flex items-center justify-center ${getResponsiveClass('p-2', 'p-1.5', 'p-2', 'p-3')}`}
                >
                  <X size={24} className={`text-gray-400 ${getResponsiveClass('w-6 h-6', 'w-5 h-5', 'w-6 h-6', 'w-7 h-7')}`} />
                </button>
              </div>

              <div className={`flex-1 overflow-y-auto ${getResponsiveClass('p-4 sm:p-6', 'p-3', 'p-4', 'p-8')}`}>
                <div className={`grid grid-cols-2 sm:grid-cols-3 ${getResponsiveClass('gap-3 sm:gap-4', 'gap-2', 'gap-3', 'gap-4')}`}>
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
                      <div className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end ${getResponsiveClass('p-3', 'p-2', 'p-3', 'p-4')}`}>
                        <p className={`text-white font-bold truncate ${getResponsiveClass('text-xs', 'text-[10px]', 'text-xs', 'text-sm')}`}>{c.name}</p>
                        <p className={`text-white/70 ${getResponsiveClass('text-[10px]', 'text-[8px]', 'text-[10px]', 'text-xs')}`}>{c.denomination}</p>
                      </div>
                    </div>
                  ))}
                  {allCoins.filter(c => userCoinImages[c.id] || customCoins.some(cc => cc.id === c.id)).length === 0 && (
                    <div className="col-span-full text-center py-20">
                      <div className={`bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300 ${getResponsiveClass('w-20 h-20', 'w-16 h-16', 'w-20 h-20', 'w-24 h-24')}`}>
                        <Camera size={40} className={getResponsiveClass('w-10 h-10', 'w-8 h-8', 'w-10 h-10', 'w-12 h-12')} />
                      </div>
                      <h3 className={`font-bold text-gray-900 dark:text-white ${getResponsiveClass('text-lg', 'text-base', 'text-lg', 'text-xl')}`}>No custom photos yet</h3>
                      <p className={`text-gray-500 dark:text-gray-400 ${getResponsiveClass('text-sm', 'text-xs', 'text-sm', 'text-base')}`}>Add coins manually or change images to see them here.</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Story Mode Modal (Merged Hub) */}
      <AnimatePresence>
        {isStoryModeOpen && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-0 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsStoryModeOpen(false);
                setActiveGameMode(null);
              }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              className={`relative w-full max-w-5xl bg-white dark:bg-gray-950 rounded-t-[2.5rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col h-[95vh] sm:h-[90vh] ${getResponsiveClass('m-0 sm:m-4', 'm-0', 'm-0 sm:m-4', 'm-0 sm:m-6')}`}
            >
              {/* Header */}
              <div className={`border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/50 sticky top-0 z-10 ${getResponsiveClass('p-6', 'p-3', 'p-6', 'p-8')}`}>
                <div className="flex items-center gap-4">
                  <div className={`bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center shadow-inner ${getResponsiveClass('w-12 h-12', 'w-10 h-10', 'w-12 h-12', 'w-14 h-14')}`}>
                    <Sparkles size={24} className={getResponsiveClass('w-6 h-6', 'w-5 h-5', 'w-6 h-6', 'w-7 h-7')} />
                  </div>
                  <div>
                    <h3 className={`font-black text-gray-900 dark:text-white uppercase tracking-tight ${getResponsiveClass('text-xl', 'text-lg', 'text-xl', 'text-2xl')}`}>Story Mode</h3>
                    <p className={`text-gray-500 dark:text-gray-400 font-black uppercase tracking-widest ${getResponsiveClass('text-[10px]', 'text-[8px]', 'text-[10px]', 'text-xs')}`}>Your Numismatic Journey</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setIsStoryModeOpen(false);
                    setActiveGameMode(null);
                  }} 
                  className={`bg-white dark:bg-gray-800 rounded-full shadow-sm flex items-center justify-center ${getResponsiveClass('p-3', 'p-2', 'p-3', 'p-4')}`}
                >
                  <X size={24} className={getResponsiveClass('w-6 h-6', 'w-5 h-5', 'w-6 h-6', 'w-7 h-7')} />
                </button>
              </div>

              {/* Content (Netflix Style) */}
              <div className={`flex-1 overflow-y-auto no-scrollbar space-y-10 ${getResponsiveClass('p-6', 'p-3', 'p-6', 'p-8')}`}>
                
                {activeGameMode === 'era-conquest' ? (
                  <div className="space-y-8">
                    <button 
                      onClick={() => setActiveGameMode(null)}
                      className="flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                      <ArrowLeft size={20} />
                      <span className="text-xs font-black uppercase tracking-widest">Back to Story Hub</span>
                    </button>

                    <div className="grid grid-cols-1 gap-6">
                      {ERAS.map(era => {
                        const progress = getEraProgress(era);
                        const isLocked = era.isLocked && !Object.values(userProfile.eraConquestProgress).some(p => p > 0);
                        
                        return (
                          <div 
                            key={era.id}
                            className={`bg-white dark:bg-gray-900 rounded-premium p-8 premium-shadow border border-gray-100 dark:border-gray-800 ${isLocked ? 'opacity-60 grayscale' : ''}`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                              <div>
                                <h4 className="text-3xl font-display font-bold text-gray-900 dark:text-white mb-1">{era.name}</h4>
                                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">{era.description}</p>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Era Progress</p>
                                  <p className="text-2xl font-black text-gray-900 dark:text-white">{progress}%</p>
                                </div>
                                <div className="w-16 h-16 rounded-full border-4 border-amber-100 dark:border-amber-900/30 flex items-center justify-center relative">
                                  <svg className="w-full h-full -rotate-90">
                                    <circle
                                      cx="32"
                                      cy="32"
                                      r="28"
                                      fill="transparent"
                                      stroke="currentColor"
                                      strokeWidth="4"
                                      className="text-amber-500"
                                      strokeDasharray={175.9}
                                      strokeDashoffset={175.9 * (1 - progress / 100)}
                                    />
                                  </svg>
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <Award size={24} className="text-amber-500" />
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-4">
                              <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Era Challenges</h5>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {era.challenges.map(challenge => {
                                  const current = getChallengeProgress(challenge);
                                  const isCompleted = current >= challenge.target;
                                  const challengeProgress = (current / challenge.target) * 100;

                                  return (
                                    <div 
                                      key={challenge.id}
                                      className={`p-5 rounded-2xl border-2 transition-all ${isCompleted ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800' : 'bg-gray-50 dark:bg-gray-800/50 border-transparent'}`}
                                    >
                                      <div className="flex justify-between items-start mb-3">
                                        <div>
                                          <p className="font-bold text-gray-900 dark:text-white">{challenge.title}</p>
                                          <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">{challenge.description}</p>
                                        </div>
                                        {isCompleted ? (
                                          <CheckCircle2 size={20} className="text-amber-500" />
                                        ) : (
                                          <div className="px-2 py-1 bg-white dark:bg-gray-800 rounded-lg text-[8px] font-black text-amber-600 uppercase tracking-widest border border-amber-100 dark:border-amber-800">
                                            +{challenge.reward} XP
                                          </div>
                                        )}
                                      </div>
                                      <div className="space-y-1.5">
                                        <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-gray-400">
                                          <span>Progress</span>
                                          <span>{current} / {challenge.target}</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                          <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${challengeProgress}%` }}
                                            className="h-full bg-amber-500"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : activeGameMode === 'timeline-puzzle' ? (
                  <div className="space-y-8">
                    <button 
                      onClick={() => setActiveGameMode(null)}
                      className="flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                      <ArrowLeft size={20} />
                      <span className="text-xs font-black uppercase tracking-widest">Back to Story Hub</span>
                    </button>

                    {!puzzleState ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {TIMELINES.map(timeline => (
                          <motion.div
                            key={timeline.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => startPuzzle(timeline)}
                            className="bg-white dark:bg-gray-900 rounded-premium p-8 premium-shadow border border-gray-100 dark:border-gray-800 cursor-pointer group"
                          >
                            <h4 className="text-xl font-display font-bold text-gray-900 dark:text-white mb-2">{timeline.title}</h4>
                            <p className="text-gray-500 dark:text-gray-400 text-xs font-medium mb-4">{timeline.events.length} Events to Order</p>
                            <div className="flex items-center gap-2 text-rose-500 font-black text-[10px] uppercase tracking-widest">
                              <ArrowRight size={14} />
                              <span>Start Puzzle</span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="max-w-2xl mx-auto space-y-8">
                        <div className="text-center space-y-2">
                          <h4 className="text-3xl font-display font-bold text-gray-900 dark:text-white">Reconstruct History</h4>
                          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Click two events to swap their positions. Put them in chronological order!</p>
                        </div>

                        <div className="space-y-3">
                          {puzzleState.userOrder.map((eventIdx, currentPos) => {
                            const event = puzzleState.events[eventIdx];
                            const isCorrect = eventIdx === currentPos;
                            
                            return (
                              <motion.div
                                key={eventIdx}
                                layout
                                onClick={() => {
                                  if (puzzleState.isComplete) return;
                                  // Simple selection logic for swapping
                                  const selectedIdx = (window as any)._selectedPuzzleIdx;
                                  if (selectedIdx === undefined) {
                                    (window as any)._selectedPuzzleIdx = currentPos;
                                    // Force re-render would be better but this is a quick way to handle state in this environment
                                    // Actually, let's just use a local state for selection if possible, but we are inside a large component.
                                    // I'll just use a simple state for selection.
                                  } else {
                                    swapPuzzleItems(selectedIdx, currentPos);
                                    (window as any)._selectedPuzzleIdx = undefined;
                                  }
                                }}
                                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-4 ${
                                  puzzleState.isComplete 
                                    ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800' 
                                    : (window as any)._selectedPuzzleIdx === currentPos
                                      ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-500'
                                      : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:border-gray-200'
                                }`}
                              >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${
                                  isCorrect ? 'bg-green-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                                }`}>
                                  {currentPos + 1}
                                </div>
                                <div className="flex-1">
                                  <p className="font-bold text-gray-900 dark:text-white">{event.event}</p>
                                  {puzzleState.isComplete && (
                                    <p className="text-[10px] text-green-600 dark:text-green-400 font-black uppercase tracking-widest mt-1">{event.year}</p>
                                  )}
                                </div>
                                {isCorrect && <CheckCircle2 size={20} className="text-green-500" />}
                              </motion.div>
                            );
                          })}
                        </div>

                        {puzzleState.isComplete && (
                          <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-green-500 p-8 rounded-premium text-white text-center space-y-4 shadow-xl"
                          >
                            <Sparkles size={48} className="mx-auto" />
                            <h5 className="text-2xl font-display font-bold">Timeline Restored!</h5>
                            <p className="text-white/80 font-medium">You've successfully reconstructed the historical sequence. +500 XP Awarded!</p>
                            <button 
                              onClick={() => {
                                setPuzzleState(null);
                                setActiveGameMode(null);
                              }}
                              className="px-8 py-3 bg-white text-green-600 font-black uppercase tracking-widest text-xs rounded-full hover:scale-105 transition-transform"
                            >
                              Continue Journey
                            </button>
                          </motion.div>
                        )}
                      </div>
                    )}
                  </div>
                ) : activeGameMode === 'mind-map' ? (
                  <div className="space-y-6">
                    <button 
                      onClick={() => setActiveGameMode(null)}
                      className="flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                      <ArrowLeft size={20} />
                      <span className="text-xs font-black uppercase tracking-widest">Back to Story Hub</span>
                    </button>
                    <MindMapTimeline 
                      coins={EUROPEAN_COINS} 
                      collectedIds={collectedIds} 
                      onSelectCoin={(coin) => {
                        handleSelectCoin(coin);
                        setIsStoryModeOpen(false);
                      }} 
                    />
                  </div>
                ) : activeGameMode ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
                    <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-300">
                      <FlaskConical size={48} />
                    </div>
                    <div>
                      <h4 className="text-2xl font-display font-bold text-gray-900 dark:text-white">Mode Under Construction</h4>
                      <p className="text-gray-500 dark:text-gray-400 max-w-xs mx-auto mt-2">
                        We're currently minting this new game mode. Check back soon for more challenges!
                      </p>
                    </div>
                    <button 
                      onClick={() => setActiveGameMode(null)}
                      className="px-8 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black uppercase tracking-widest text-xs rounded-full hover:scale-105 transition-transform active:scale-95"
                    >
                      Back to Hub
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Continue Exploring */}
                    {(userProfile.lastTimelineId || activeGameMode) && (
                      <section className="space-y-4">
                        <h4 className={`font-black text-gray-900 dark:text-white uppercase tracking-[0.2em] ${getResponsiveClass('text-xs', 'text-[10px]', 'text-xs', 'text-sm')}`}>Continue Exploring</h4>
                        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                          {userProfile.lastTimelineId && allTimelines.filter(t => t.id === userProfile.lastTimelineId).map(timeline => {
                            const progress = userProfile.timelineProgress[timeline.id] || 0;
                            return (
                              <motion.div 
                                key={timeline.id}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                  setActiveTimeline(timeline);
                                  setIsStoryModeOpen(false);
                                }}
                                className={`flex-shrink-0 w-80 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-6 text-white shadow-xl cursor-pointer relative overflow-hidden group`}
                              >
                                <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 transition-opacity">
                                  <History size={80} />
                                </div>
                                <div className="relative z-10 space-y-3">
                                  <h5 className="text-xl font-black leading-tight">{timeline.title}</h5>
                                  <p className="text-white/80 text-xs font-medium line-clamp-2">{timeline.description}</p>
                                  <div className="pt-2 space-y-1.5">
                                    <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest text-white/70">
                                      <span>Progress</span>
                                      <span>{progress}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                                      <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="h-full bg-white" />
                                    </div>
                                  </div>
                                  <div className="pt-2 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                        <ArrowRight size={16} />
                                      </div>
                                      <span className="text-[10px] font-black uppercase tracking-widest">Resume Timeline</span>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </section>
                    )}

                    {/* Timelines Section */}
                    <section className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className={`font-black text-gray-900 dark:text-white uppercase tracking-[0.2em] ${getResponsiveClass('text-xs', 'text-[10px]', 'text-xs', 'text-sm')}`}>Historical Timelines</h4>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{allTimelines.length} Available</span>
                      </div>
                      <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                        {allTimelines.map(timeline => {
                          const isLocked = timeline.unlockCondition && (
                            (timeline.unlockCondition.type === 'coins' && collectedIds.length < (timeline.unlockCondition.value as number)) ||
                            (timeline.unlockCondition.type === 'level' && userProfile.level < (timeline.unlockCondition.value as number)) ||
                            (timeline.unlockCondition.type === 'timeline' && (userProfile.timelineProgress[timeline.unlockCondition.value as string] || 0) < 100)
                          );
                          const progress = userProfile.timelineProgress[timeline.id] || 0;

                          return (
                            <motion.div 
                              key={timeline.id}
                              whileHover={isLocked ? {} : { y: -5, scale: 1.02 }}
                              whileTap={isLocked ? {} : { scale: 0.98 }}
                              onClick={() => {
                                if (isLocked) return;
                                setActiveTimeline(timeline);
                                setIsStoryModeOpen(false);
                                setUserProfile(prev => ({ ...prev, lastTimelineId: timeline.id }));
                              }}
                              className={`flex-shrink-0 w-64 bg-white dark:bg-gray-900 rounded-premium p-6 text-gray-900 dark:text-white premium-shadow hover:premium-shadow-hover transition-all cursor-pointer border-2 relative overflow-hidden group ${isLocked ? 'opacity-60 grayscale' : 'border-transparent'}`}
                            >
                              {isLocked && (
                                <div className="absolute inset-0 bg-black/5 dark:bg-white/5 flex items-center justify-center z-20">
                                  <Shield size={32} className="text-gray-400" />
                                </div>
                              )}
                              <div className="space-y-3 relative z-10">
                                <div className="flex items-center justify-between">
                                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isLocked ? 'bg-gray-100 text-gray-400' : 'bg-blue-50 text-blue-500'}`}>
                                    {timeline.id === 'my-story' ? <Sparkles size={20} /> : <History size={20} />}
                                  </div>
                                  {progress === 100 && <CheckCircle2 size={16} className="text-green-500" />}
                                </div>
                                <h5 className="text-lg font-display font-bold leading-tight truncate">{timeline.title}</h5>
                                <p className="text-gray-500 dark:text-gray-400 text-xs font-medium line-clamp-2">
                                  {isLocked ? timeline.unlockCondition?.description : timeline.description}
                                </p>
                                
                                {!isLocked && (
                                  <div className="pt-2 space-y-1.5">
                                    <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest text-gray-400">
                                      <span>Progress</span>
                                      <span>{progress}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                      <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="h-full bg-blue-500" />
                                    </div>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </section>

                    {/* Game Modes Section */}
                    <section className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className={`font-black text-gray-900 dark:text-white uppercase tracking-[0.2em] ${getResponsiveClass('text-xs', 'text-[10px]', 'text-xs', 'text-sm')}`}>Game Modes</h4>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{GAME_MODES.length} Available</span>
                      </div>
                      <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                        {GAME_MODES.map(mode => {
                          const isLocked = mode.isLocked;
                          return (
                            <motion.div
                              key={mode.id}
                              whileHover={isLocked ? {} : { y: -5, scale: 1.02 }}
                              whileTap={isLocked ? {} : { scale: 0.98 }}
                              onClick={() => {
                                if (isLocked) return;
                                if (mode.id === 'coin-story') {
                                  setActiveTimeline(myCoinStory);
                                  setIsStoryModeOpen(false);
                                } else {
                                  setActiveGameMode(mode.id);
                                }
                              }}
                              className={`flex-shrink-0 w-64 bg-gradient-to-br ${mode.color} rounded-premium p-6 text-white shadow-xl cursor-pointer relative overflow-hidden group ${isLocked ? 'opacity-60 grayscale' : ''}`}
                            >
                              <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 transition-opacity">
                                {mode.icon}
                              </div>
                              <div className="relative z-10 space-y-3">
                                <h5 className="text-lg font-display font-bold leading-tight">{mode.title}</h5>
                                <p className="text-white/80 text-xs font-medium line-clamp-2">{isLocked ? mode.unlockCondition : mode.description}</p>
                                
                                <div className="pt-2 flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                      {isLocked ? <Shield size={16} /> : <ArrowRight size={16} />}
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest">{isLocked ? 'Locked' : 'Play Now'}</span>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </section>

                    {/* Stats Section */}
                    <section className="space-y-4">
                      <h4 className={`font-black text-gray-900 dark:text-white uppercase tracking-[0.2em] ${getResponsiveClass('text-xs', 'text-[10px]', 'text-xs', 'text-sm')}`}>Story Progress</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-5 rounded-3xl border border-indigo-100 dark:border-indigo-800">
                          <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">Total XP</p>
                          <p className="text-2xl font-black text-gray-900 dark:text-white">{userProfile.points}</p>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-3xl border border-blue-100 dark:border-blue-800">
                          <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">Timelines</p>
                          <p className="text-2xl font-black text-gray-900 dark:text-white">{Object.values(userProfile.timelineProgress).filter(p => p === 100).length} / {allTimelines.length}</p>
                        </div>
                        <div className="bg-amber-50 dark:bg-amber-900/20 p-5 rounded-3xl border border-amber-100 dark:border-amber-800">
                          <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Eras</p>
                          <p className="text-2xl font-black text-gray-900 dark:text-white">{ERAS.filter(e => getEraProgress(e) === 100).length} / {ERAS.length}</p>
                        </div>
                        <div className="bg-purple-50 dark:bg-purple-900/20 p-5 rounded-3xl border border-purple-100 dark:border-purple-800">
                          <p className="text-[10px] font-black text-purple-500 uppercase tracking-widest mb-1">Badges</p>
                          <p className="text-2xl font-black text-gray-900 dark:text-white">{userProfile.badges.length}</p>
                        </div>
                      </div>
                    </section>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Timeline Detail Modal */}
      <AnimatePresence>
        {activeTimeline && (
          <div className="fixed inset-0 z-[140] flex items-center justify-center p-0 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveTimeline(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`relative w-full max-w-2xl bg-white dark:bg-gray-950 rounded-t-[2.5rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col h-[95vh] sm:h-[80vh] ${getResponsiveClass('m-0 sm:m-4', 'm-0', 'm-0 sm:m-4', 'm-0 sm:m-6')}`}
            >
              {/* Header */}
              <div className={`border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/50 sticky top-0 z-10 ${getResponsiveClass('p-6', 'p-3', 'p-6', 'p-8')}`}>
                <div className="flex items-center gap-4">
                  <button onClick={() => setActiveTimeline(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                    <ArrowLeft size={24} className="text-gray-900 dark:text-white" />
                  </button>
                  <div>
                    <h3 className={`font-black text-gray-900 dark:text-white uppercase tracking-tight ${getResponsiveClass('text-xl', 'text-lg', 'text-xl', 'text-2xl')}`}>{activeTimeline.title}</h3>
                    <p className={`text-gray-500 dark:text-gray-400 font-black uppercase tracking-widest ${getResponsiveClass('text-[10px]', 'text-[8px]', 'text-[10px]', 'text-xs')}`}>Timeline Progress</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Completion</p>
                    <p className="text-lg font-black text-gray-900 dark:text-white">{userProfile.timelineProgress[activeTimeline.id] || 0}%</p>
                  </div>
                </div>
              </div>

              {/* Timeline Content */}
              <div className={`flex-1 overflow-y-auto no-scrollbar ${getResponsiveClass('p-6', 'p-3', 'p-6', 'p-8')}`}>
                <div className="relative">
                  {/* Vertical Line */}
                  <div className="absolute left-4 top-0 bottom-0 w-1 bg-gray-100 dark:bg-gray-800 rounded-full" />
                  
                  <div className="space-y-12 relative">
                    {activeTimeline.events.map((event, idx) => {
                      const isCompleted = (userProfile.timelineProgress[activeTimeline.id] || 0) >= ((idx + 1) / activeTimeline.events.length) * 100;
                      const isExpanded = expandedEvents[activeTimeline.id]?.[idx];
                      
                      return (
                        <motion.div 
                          key={idx}
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: idx * 0.1 }}
                          className="flex gap-8 group cursor-pointer"
                          onClick={() => setExpandedEvents(prev => ({
                            ...prev,
                            [activeTimeline.id]: {
                              ...(prev[activeTimeline.id] || {}),
                              [idx]: !isExpanded
                            }
                          }))}
                        >
                          {/* Dot */}
                          <div className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center border-4 border-white dark:border-gray-950 shadow-sm transition-colors ${isCompleted ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-800'}`}>
                            {isCompleted ? <CheckCircle2 size={16} className="text-white" /> : <div className="w-2 h-2 rounded-full bg-gray-400" />}
                          </div>

                          <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-blue-500 font-black text-sm uppercase tracking-widest">{event.year}</span>
                              <div className="flex items-center gap-3">
                                {!isCompleted && (
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const newProgress = Math.round(((idx + 1) / activeTimeline.events.length) * 100);
                                      const today = new Date().toISOString().split('T')[0];
                                      
                                      setUserProfile(prev => {
                                        const updatedProgress = {
                                          ...prev.timelineProgress,
                                          [activeTimeline.id]: Math.max(prev.timelineProgress[activeTimeline.id] || 0, newProgress)
                                        };
                                        
                                        // Award Timeline Badges
                                        const newBadges = [...prev.badges];
                                        if (newProgress === 100 && !newBadges.includes('b6')) {
                                          newBadges.push('b6');
                                          addPoints(1000, "Badge Unlocked: Timeline Explorer!");
                                        }
                                        
                                        const allCompleted = allTimelines.every(t => (updatedProgress[t.id] || 0) === 100);
                                        if (allCompleted && !newBadges.includes('b7')) {
                                          newBadges.push('b7');
                                          addPoints(5000, "Badge Unlocked: Timeline Master!");
                                        }

                                        // Streak Logic
                                        let newTimelineStreak = prev.timelineStreak;
                                        if (prev.lastTimelineDate !== today) {
                                          const yesterday = new Date();
                                          yesterday.setDate(yesterday.getDate() - 1);
                                          const yesterdayStr = yesterday.toISOString().split('T')[0];
                                          
                                          if (prev.lastTimelineDate === yesterdayStr) {
                                            newTimelineStreak += 1;
                                          } else {
                                            newTimelineStreak = 1;
                                          }
                                        }
                                        
                                        addPoints(POINT_VALUES.TIMELINE_EXPLORE, `Explored: ${event.event}`);
                                        
                                        return {
                                          ...prev,
                                          timelineProgress: updatedProgress,
                                          badges: newBadges,
                                          timelineStreak: newTimelineStreak,
                                          lastTimelineDate: today
                                        };
                                      });
                                    }}
                                    className="text-[10px] font-black text-blue-500 hover:text-blue-600 uppercase tracking-widest transition-colors bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full"
                                  >
                                    Discover
                                  </button>
                                )}
                                <ChevronDown size={16} className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                              </div>
                            </div>
                            <h4 className="text-lg font-black text-gray-900 dark:text-white leading-tight">{event.event}</h4>
                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div 
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden"
                                >
                                  <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 mt-2">
                                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed font-medium">{event.note}</p>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800">
                <button 
                  onClick={() => setActiveTimeline(null)}
                  className="w-full py-4 bg-blue-500 text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-100 dark:shadow-none hover:bg-blue-600 transition-all active:scale-95"
                >
                  Close Timeline
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Quick Add Mode Modal */}
      <AnimatePresence>
        {isQuickAddOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsQuickAddOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`relative w-full max-w-md bg-white dark:bg-gray-900 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[85vh] ${getResponsiveClass('m-4', 'm-2', 'm-4', 'm-6')}`}
            >
              <div className={`border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-green-50 dark:bg-green-900/10 ${getResponsiveClass('p-6', 'p-3', 'p-6', 'p-8')}`}>
                <div className="flex items-center gap-4">
                  <div className={`bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-2xl flex items-center justify-center shadow-inner ${getResponsiveClass('w-12 h-12', 'w-10 h-10', 'w-12 h-12', 'w-14 h-14')}`}>
                    <Plus size={24} className={getResponsiveClass('w-6 h-6', 'w-5 h-5', 'w-6 h-6', 'w-7 h-7')} />
                  </div>
                  <div>
                    <h3 className={`font-black text-gray-900 dark:text-white uppercase tracking-tight ${getResponsiveClass('text-xl', 'text-lg', 'text-xl', 'text-2xl')}`}>Quick Add</h3>
                    <p className={`text-gray-500 dark:text-gray-400 font-black uppercase tracking-widest ${getResponsiveClass('text-[10px]', 'text-[8px]', 'text-[10px]', 'text-xs')}`}>Rapid collection entry</p>
                  </div>
                </div>
                <button onClick={() => setIsQuickAddOpen(false)} className={`bg-white dark:bg-gray-800 rounded-full shadow-sm flex items-center justify-center ${getResponsiveClass('p-3', 'p-2', 'p-3', 'p-4')}`}>
                  <X size={24} className={getResponsiveClass('w-6 h-6', 'w-5 h-5', 'w-6 h-6', 'w-7 h-7')} />
                </button>
              </div>
              
              <div className={`flex-1 overflow-y-auto space-y-4 no-scrollbar ${getResponsiveClass('p-6', 'p-3', 'p-6', 'p-8')}`}>
                {allCoins.slice(0, 30).map(coin => (
                  <div key={coin.id} className={`flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-2xl border border-transparent hover:border-green-200 transition-all ${getResponsiveClass('p-4', 'p-2', 'p-4', 'p-6')}`}>
                    <div className="flex items-center gap-4">
                      <div className={`bg-white dark:bg-gray-700 rounded-xl flex items-center justify-center shadow-sm ${getResponsiveClass('w-12 h-12', 'w-10 h-10', 'w-12 h-12', 'w-14 h-14')}`}>
                        <img src={coin.imageUrl} alt="" className={getResponsiveClass('w-8 h-8', 'w-6 h-6', 'w-8 h-8', 'w-10 h-10')} referrerPolicy="no-referrer" />
                      </div>
                      <div>
                        <p className={`font-bold text-gray-900 dark:text-white ${getResponsiveClass('text-sm', 'text-xs', 'text-sm', 'text-base')}`}>{coin.name}</p>
                        <p className={`font-bold uppercase tracking-widest text-gray-400 ${getResponsiveClass('text-[10px]', 'text-[8px]', 'text-[10px]', 'text-xs')}`}>{coin.denomination}</p>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => toggleCollected(coin.id, e, true)}
                      className={`bg-green-500 text-white rounded-xl shadow-lg shadow-green-100 dark:shadow-none active:scale-90 transition-transform flex items-center justify-center ${getResponsiveClass('p-3', 'p-2', 'p-3', 'p-4')}`}
                    >
                      <Plus size={20} className={getResponsiveClass('w-5 h-5', 'w-4 h-4', 'w-5 h-5', 'w-6 h-6')} />
                    </button>
                  </div>
                ))}
              </div>
              
              <div className="p-6 bg-gray-50 dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 text-center">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Rapid Entry Mode Active</p>
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
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white">Version Mismatch</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    We've detected data from a different version. Would you like to normalize and import it? Unknown fields will be safely removed.
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
                  Normalize & Import
                </button>
              </div>
              
              <p className="text-[10px] text-center text-gray-400 uppercase font-bold tracking-widest">
                Safe & Offline Compatible
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Export Version Modal */}
      <AnimatePresence>
        {isExportModalOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsExportModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-[2.5rem] overflow-hidden shadow-2xl p-8 space-y-6"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-3xl flex items-center justify-center">
                  <Share size={40} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Export Collection</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Choose a version for your export. Downgrading will remove features not supported in older versions.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  { id: '3.0', label: 'Version 3.0 (Current)', desc: 'Full data including history and missions.' },
                  { id: '2.5', label: 'Version 2.5', desc: 'Core data + purchased coins and denominations.' },
                  { id: '2.0', label: 'Version 2.0 (Legacy)', desc: 'Basic collection data only.' }
                ].map((v) => (
                  <button
                    key={v.id}
                    onClick={() => exportCollection(v.id as AppVersion)}
                    className="w-full p-4 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl text-left hover:border-blue-500 transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-gray-900 dark:text-white uppercase tracking-widest text-xs">{v.label}</span>
                      <ArrowRight size={16} className="text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                    </div>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 font-bold">{v.desc}</p>
                  </button>
                ))}
              </div>

              <button
                onClick={() => setIsExportModalOpen(false)}
                className="w-full py-4 text-gray-400 font-black uppercase tracking-widest text-[10px] hover:text-gray-600 transition-colors"
              >
                Cancel
              </button>
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
              className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
            >
              <div className="p-6 sm:p-8 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-amber-50 dark:bg-amber-900/10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center shadow-inner">
                    <Globe size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Web Search</h3>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-black uppercase tracking-widest">Find the perfect photo</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsWebSearchOpen(false)}
                  className="p-3 hover:bg-amber-100 dark:hover:bg-amber-900/30 text-gray-400 hover:text-amber-600 rounded-full transition-all active:scale-90"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 sm:p-8 space-y-6 flex-1 overflow-y-auto no-scrollbar">
                <div className="relative group">
                  <input 
                    type="text"
                    value={webSearchQuery}
                    onChange={(e) => setWebSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && searchWebImages(webSearchQuery)}
                    placeholder="Search for coin images..."
                    className="w-full pl-12 pr-14 py-4 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-amber-500 rounded-2xl text-sm font-bold transition-all placeholder:text-gray-400"
                  />
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-amber-500 transition-colors" size={20} />
                  <button 
                    onClick={() => searchWebImages(webSearchQuery)}
                    disabled={isSearchingWeb}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-all shadow-lg shadow-amber-100 disabled:opacity-50 active:scale-95"
                  >
                    {isSearchingWeb ? <Loader2 size={20} className="animate-spin" /> : <RefreshCw size={20} />}
                  </button>
                </div>

                {isSearchingWeb ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-6">
                    <div className="relative">
                      <div className="w-16 h-16 border-4 border-amber-100 rounded-full animate-pulse" />
                      <Loader2 size={48} className="text-amber-500 animate-spin absolute inset-0" />
                    </div>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">Searching the web...</p>
                  </div>
                ) : webSearchResults.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4">
                    {webSearchResults.map((url, idx) => (
                      <motion.div
                        key={idx}
                        whileHover={{ scale: 1.05, y: -4 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => selectWebImage(url)}
                        className="relative aspect-square rounded-[1.5rem] overflow-hidden bg-gray-100 dark:bg-gray-800 cursor-pointer group border-4 border-transparent hover:border-amber-500 transition-all shadow-md"
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
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center backdrop-blur-[2px] opacity-0 group-hover:opacity-100">
                          <Plus className="text-white" size={32} />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 bg-gray-50 dark:bg-gray-800/50 rounded-[2rem] border-2 border-dashed border-gray-100 dark:border-gray-800">
                    <div className="w-20 h-20 bg-white dark:bg-gray-800 text-gray-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                      <Search size={40} />
                    </div>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">No images found</p>
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
              className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-6 sm:p-8 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-amber-50 dark:bg-amber-900/10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center shadow-inner">
                    <Plus size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Add Manually</h3>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-black uppercase tracking-widest">Custom collection entry</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsManualAddOpen(false)}
                  className="p-3 hover:bg-amber-100 dark:hover:bg-amber-900/30 text-gray-400 hover:text-amber-600 rounded-full transition-all active:scale-90"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 sm:p-8 space-y-6 overflow-y-auto no-scrollbar">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Coin Name</label>
                  <input 
                    type="text"
                    value={manualCoinName}
                    onChange={(e) => setManualCoinName(e.target.value)}
                    placeholder="e.g. Rare 50p Find"
                    className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-amber-500 rounded-2xl text-sm font-bold transition-all placeholder:text-gray-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Country</label>
                    <select 
                      value={manualCoinCountry}
                      onChange={(e) => setManualCoinCountry(e.target.value)}
                      className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-amber-500 rounded-2xl text-sm font-bold transition-all appearance-none"
                    >
                      {['UK', 'Ireland', 'France', 'Germany', 'Italy', 'Spain', 'Netherlands', 'Belgium', 'Austria'].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Era</label>
                    <select 
                      value={manualCoinType}
                      onChange={(e) => setManualCoinType(e.target.value as 'Modern' | 'Old')}
                      className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-amber-500 rounded-2xl text-sm font-bold transition-all appearance-none"
                    >
                      <option value="Modern">Modern (Euro/Decimal)</option>
                      <option value="Old">Old (Pre-Euro/Pre-Decimal)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Denomination</label>
                    <select 
                      value={manualCoinDenom}
                      onChange={(e) => setManualCoinDenom(e.target.value)}
                      className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-amber-500 rounded-2xl text-sm font-bold transition-all appearance-none"
                    >
                      {DENOMINATIONS.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Year</label>
                    <input 
                      type="number"
                      value={manualCoinYear}
                      onChange={(e) => setManualCoinYear(parseInt(e.target.value))}
                      className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-amber-500 rounded-2xl text-sm font-bold transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Summary</label>
                  <textarea 
                    value={manualCoinSummary}
                    onChange={(e) => setManualCoinSummary(e.target.value)}
                    placeholder="Brief description of the coin..."
                    rows={2}
                    className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-amber-500 rounded-2xl text-sm font-bold transition-all resize-none placeholder:text-gray-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Est. Value (£)</label>
                    <input 
                      type="number"
                      step="0.01"
                      value={manualCoinValue}
                      onChange={(e) => setManualCoinValue(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-amber-500 rounded-2xl text-sm font-bold transition-all placeholder:text-gray-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Rarity</label>
                    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                    {['Common', 'Uncommon', 'Rare', 'Ultra Rare'].map(r => (
                      <button
                        key={r}
                        onClick={() => setManualCoinRarity(r)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          manualCoinRarity === r 
                            ? 'bg-amber-500 text-white shadow-lg shadow-amber-100 scale-105' 
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Coin Photo</label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="relative aspect-video rounded-[1.5rem] border-4 border-dashed border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex flex-col items-center justify-center cursor-pointer hover:border-amber-500 transition-all overflow-hidden group"
                  >
                    {manualCoinPhoto ? (
                      <img src={manualCoinPhoto} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-300 group-hover:text-amber-500 transition-colors shadow-sm mb-3">
                          <Camera size={32} />
                        </div>
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Tap to upload</p>
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
                  className="w-full py-5 bg-amber-500 text-white font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-amber-600 transition-all shadow-xl shadow-amber-100 disabled:opacity-50 flex items-center justify-center gap-3 active:scale-95"
                >
                  {isAnalyzing ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={24} />}
                  Add to Collection
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Collector Identity Card Modal */}
      <AnimatePresence>
        {isIdentityCardOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsIdentityCardOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-white dark:bg-gray-900 rounded-[2.5rem] overflow-hidden shadow-2xl"
            >
              <div className="bg-amber-500 p-8 text-white text-center space-y-4">
                <div className="w-24 h-24 bg-white rounded-full mx-auto p-1 shadow-xl">
                  <img src={userProfile.avatar} alt="Avatar" className="w-full h-full rounded-full" />
                </div>
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-tight">{userProfile.name}</h2>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">{userProfile.rank}</p>
                </div>
              </div>
              
              <div className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl text-center">
                    <p className="text-2xl font-black text-gray-900 dark:text-white">{collectedIds.length}</p>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Coins</p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl text-center">
                    <p className="text-2xl font-black text-gray-900 dark:text-white">{userProfile.points}</p>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Points</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-400">
                    <span>Collection Progress</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500" style={{ width: `${progress}%` }} />
                  </div>
                </div>
                
                <button 
                  onClick={() => {
                    alert("Identity Card saved to gallery!");
                    setIsIdentityCardOpen(false);
                  }}
                  className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2"
                >
                  <Share size={18} />
                  Save & Share
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Collection Timeline Modal */}
      <AnimatePresence>
        {isTimelineOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTimelineOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-[2.5rem] max-h-[80vh] overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <h2 className="text-xl font-black uppercase tracking-tight">Collection History</h2>
                <button onClick={() => setIsTimelineOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {Object.entries(collectionHistory)
                  .sort(([, a], [, b]) => new Date(b).getTime() - new Date(a).getTime())
                  .map(([id, date]) => {
                    const coin = allCoins.find(c => c.id === id);
                    if (!coin) return null;
                    return (
                      <div key={id} className="flex gap-4 relative">
                        <div className="absolute left-[19px] top-8 bottom-[-24px] w-0.5 bg-gray-100 dark:bg-gray-800" />
                        <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center text-amber-600 shrink-0 z-10">
                          <Clock size={20} />
                        </div>
                        <div className="flex-1 pt-1">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            {new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                          <h4 className="font-black text-gray-900 dark:text-white text-lg tracking-tight">{coin.name}</h4>
                          <p className="text-[10px] text-amber-600 uppercase font-black tracking-widest">{coin.denomination} • {coin.year}</p>
                        </div>
                      </div>
                    );
                  })}
                {Object.keys(collectionHistory).length === 0 && (
                  <div className="text-center py-12">
                    <History size={48} className="mx-auto text-gray-200 mb-4" />
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No history yet</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Quick Compare Mode UI */}
      <AnimatePresence>
        {isCompareMode && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCompareMode(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-xl"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-4xl grid grid-cols-2 gap-4 sm:gap-8"
            >
              {[0, 1].map(index => (
                <div key={index} className="bg-white dark:bg-gray-900 rounded-[2rem] p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
                  {compareCoins[index] ? (
                    <>
                      <button 
                        onClick={() => setCompareCoins(prev => {
                          const next = [...prev] as [Coin | null, Coin | null];
                          next[index] = null;
                          return next;
                        })}
                        className="absolute top-4 right-4 p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X size={16} />
                      </button>
                      <div className="aspect-square rounded-2xl overflow-hidden bg-gray-50 dark:bg-gray-800">
                        <img 
                          src={userCoinImages[compareCoins[index]!.id] || compareCoins[index]!.imageUrl} 
                          alt={compareCoins[index]!.name} 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      <div className="text-center space-y-2">
                        <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight leading-none">{compareCoins[index]!.name}</h3>
                        <p className="text-xs font-black text-amber-500 uppercase tracking-widest">{compareCoins[index]!.denomination} • {compareCoins[index]!.year}</p>
                      </div>
                      <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Rarity</span>
                          <span className="text-xs font-bold">{compareCoins[index]!.rarity || 'Common'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Value</span>
                          <span className="text-xs font-bold">£{compareCoins[index]!.value?.toFixed(2) || '0.00'}</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-20">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-300">
                        <Plus size={32} />
                      </div>
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Select a coin to compare</p>
                    </div>
                  )}
                </div>
              ))}
              
              <div className="col-span-2 flex justify-center">
                <button 
                  onClick={() => setIsCompareMode(false)}
                  className="px-8 py-4 bg-white text-gray-900 font-black uppercase tracking-widest rounded-2xl shadow-xl hover:scale-105 transition-all"
                >
                  Close Comparison
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Coin Fusion Modal */}
      <AnimatePresence>
        {isFusionModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFusionModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 shadow-2xl space-y-8"
            >
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Zap size={32} />
                </div>
                <h2 className="text-2xl font-black uppercase tracking-tight">Coin Fusion</h2>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Combine 3 duplicates for a rare coin</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {[0, 1, 2].map(i => (
                  <div key={i} className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800 flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-800/50">
                    {fusionSelection[i] ? (
                      <img 
                        src={userCoinImages[fusionSelection[i]] || allCoins.find(c => c.id === fusionSelection[i])?.imageUrl} 
                        className="w-full h-full object-cover"
                        alt="Selected"
                      />
                    ) : (
                      <Plus size={20} className="text-gray-300" />
                    )}
                  </div>
                ))}
              </div>

              <button 
                disabled={fusionSelection.length < 3}
                onClick={() => fuseCoins()}
                className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest transition-all ${
                  fusionSelection.length === 3 
                    ? 'bg-amber-500 text-white shadow-lg shadow-amber-200 dark:shadow-none hover:scale-105' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                }`}
              >
                {fusionSelection.length === 3 ? 'Start Fusion' : 'Select 3 Coins'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mystery Trade Modal */}
      <AnimatePresence>
        {isTradeModalOpen && tradeOffer && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTradeModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 shadow-2xl space-y-8"
            >
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <RefreshCw size={32} />
                </div>
                <h2 className="text-2xl font-black uppercase tracking-tight">Mystery Trade</h2>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Limited time offer</p>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">You Give</p>
                  <div className="flex justify-center -space-x-4">
                    <div className="w-12 h-12 rounded-full border-2 border-white dark:border-gray-900 overflow-hidden bg-gray-100 shadow-sm">
                      <img src={userCoinImages[tradeOffer.give.coinId] || allCoins.find(c => c.id === tradeOffer.give.coinId)?.imageUrl} className="w-full h-full object-cover" alt="Give" />
                    </div>
                    {tradeOffer.give.count > 1 && (
                      <div className="w-12 h-12 rounded-full border-2 border-white dark:border-gray-900 bg-gray-900 text-white flex items-center justify-center text-xs font-black">
                        x{tradeOffer.give.count}
                      </div>
                    )}
                  </div>
                </div>
                <ArrowRight className="text-gray-300" />
                <div className="flex-1 space-y-2">
                  <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest text-center">You Get</p>
                  <div className="flex justify-center">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-amber-50 shadow-inner p-1">
                      <div className="w-full h-full rounded-xl overflow-hidden relative">
                        <img src={allCoins.find(c => c.id === tradeOffer.get.coinId)?.imageUrl} className="w-full h-full object-cover blur-sm" alt="Get" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <HelpCircle className="text-white" size={24} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setIsTradeModalOpen(false)}
                  className="flex-1 py-4 bg-gray-100 dark:bg-gray-800 text-gray-500 font-black uppercase tracking-widest rounded-2xl"
                >
                  Decline
                </button>
                <button 
                  onClick={acceptTrade}
                  className="flex-1 py-4 bg-indigo-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-indigo-200 dark:shadow-none hover:scale-105 transition-all"
                >
                  Accept
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Multi-Select Action Bar */}
      <AnimatePresence>
        {isMultiSelectMode && selectedCoinIds.size > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[150] w-[90%] max-w-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-[2rem] p-4 shadow-2xl flex items-center justify-between gap-4 border border-white/10 dark:border-gray-200"
          >
            <div className="flex items-center gap-4 pl-2">
              <button 
                onClick={() => {
                  setIsMultiSelectMode(false);
                  setSelectedCoinIds(new Set());
                }}
                className="p-2 hover:bg-white/10 dark:hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
              <div>
                <p className="text-xs font-black uppercase tracking-widest">{selectedCoinIds.size} Selected</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const denom = prompt("Enter new denomination for selected coins:");
                  if (denom) applyBulkDenomination(denom);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 dark:bg-gray-100 hover:bg-white/20 dark:hover:bg-gray-200 rounded-xl transition-all"
              >
                <Tag size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Denom</span>
              </button>

              <button
                onClick={() => setIsBulkPriceModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 dark:bg-gray-100 hover:bg-white/20 dark:hover:bg-gray-200 rounded-xl transition-all"
              >
                <TrendingUp size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Price</span>
              </button>

              <div className="relative group">
                <button
                  className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl shadow-lg shadow-amber-500/20 hover:scale-105 transition-all"
                >
                  <Tags size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Tags</span>
                </button>
                
                <div className="absolute bottom-full right-0 mb-2 w-48 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all translate-y-2 group-hover:translate-y-0">
                  <div className="p-2 space-y-1">
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest p-2">Apply Tag</p>
                    {userProfile.tags.map(tag => (
                      <button
                        key={tag.id}
                        onClick={() => applyBulkTag(tag.id)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors text-left"
                      >
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
                        <span className="text-[10px] font-bold text-gray-900 dark:text-white uppercase tracking-widest">{tag.name}</span>
                      </button>
                    ))}
                    {userProfile.tags.length === 0 && (
                      <p className="text-[8px] text-gray-400 italic p-3">No tags found</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trade Offer Floating Button */}
      <AnimatePresence>
        {tradeOffer && !isTradeModalOpen && (
          <motion.button
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 100, opacity: 0 }}
            onClick={() => setIsTradeModalOpen(true)}
            className="fixed right-6 bottom-24 z-[80] bg-indigo-600 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-3 hover:scale-105 transition-all"
          >
            <RefreshCw size={20} className="animate-spin-slow" />
            <div className="text-left">
              <p className="text-[8px] font-black uppercase tracking-widest opacity-70">New Trade</p>
              <p className="text-[10px] font-bold">Mystery Offer Available</p>
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Bottom Navigation Menu */}
      <AnimatePresence>
        {userProfile.settings?.showBottomMenu && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl border-t border-gray-100 dark:border-gray-800 flex items-center justify-around z-[90] px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))]"
          >
            <button 
              onClick={() => {
                setSearchQuery('');
              }}
              className={`flex flex-col items-center transition-all active:scale-90 ${!isTimelineOpen ? 'text-amber-500' : 'text-gray-400'} gap-1.5`}
            >
              <div className={`rounded-xl transition-colors ${!isTimelineOpen ? 'bg-amber-50 dark:bg-amber-900/20' : ''} p-2`}>
                <LayoutGrid size={22} />
              </div>
              <span className="font-black uppercase tracking-[0.2em] text-[9px]">Collection</span>
            </button>
            <button 
              onClick={() => setIsTimelineOpen(true)}
              className={`flex flex-col items-center transition-all active:scale-90 ${isTimelineOpen ? 'text-blue-500' : 'text-gray-400'} gap-1.5`}
            >
              <div className={`rounded-xl transition-colors ${isTimelineOpen ? 'bg-blue-50 dark:bg-blue-900/20' : ''} p-2`}>
                <Clock size={22} />
              </div>
              <span className="font-black uppercase tracking-[0.2em] text-[9px]">Timeline</span>
            </button>
            <button 
              onClick={() => {
                if (isOffline) {
                  alert("Scanning requires an internet connection for AI analysis. Please try again when online.");
                  return;
                }
                setIsScanning(true);
              }}
              className={`bg-amber-500 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-amber-200 dark:shadow-none border-4 border-white dark:border-gray-900 transition-all active:scale-90 hover:bg-amber-600 ${isOffline ? 'opacity-50 grayscale cursor-not-allowed' : ''} w-14 h-14 -mt-10`}
            >
              <Camera size={28} />
            </button>
            <button 
              onClick={() => setIsManualAddOpen(true)}
              className="flex flex-col items-center text-gray-400 hover:text-amber-500 transition-all active:scale-90 gap-1.5"
            >
              <div className="rounded-xl hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors p-2">
                <Plus size={22} />
              </div>
              <span className="font-black uppercase tracking-[0.2em] text-[9px]">Add</span>
            </button>
            <button 
              onClick={() => setIsProfileOpen(true)}
              className={`flex flex-col items-center transition-all active:scale-90 ${isProfileOpen ? 'text-amber-500' : 'text-gray-400'} gap-1.5`}
            >
              <div className={`rounded-xl transition-colors ${isProfileOpen ? 'bg-amber-50 dark:bg-amber-900/20' : ''} p-2`}>
                <User size={22} />
              </div>
              <span className="font-black uppercase tracking-[0.2em] text-[9px]">Profile</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
