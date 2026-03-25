import React, { useState, useEffect, useMemo } from 'react';
import { Search, Trophy, CheckCircle2, Circle, Info, Filter, X, ChevronRight, Folder, ArrowLeft, Plus, Send, Clipboard } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UK_COINS, Coin } from './data/coins';

interface RequestedCoin {
  id: string;
  denomination: string;
  year: number;
  timestamp: number;
}

export default function App() {
  const [collectedIds, setCollectedIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('collected_coins');
    return saved ? JSON.parse(saved) : [];
  });
  const [requestedCoins, setRequestedCoins] = useState<RequestedCoin[]>(() => {
    const saved = localStorage.getItem('requested_coins');
    return saved ? JSON.parse(saved) : [];
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'collected' | 'missing'>('all');
  const [selectedCoin, setSelectedCoin] = useState<Coin | null>(null);
  const [activeDenomination, setActiveDenomination] = useState<string | null>(null);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  
  // Request Form State
  const [reqDenom, setReqDenom] = useState('50p');
  const [reqYear, setReqYear] = useState(new Date().getFullYear());

  useEffect(() => {
    localStorage.setItem('collected_coins', JSON.stringify(collectedIds));
  }, [collectedIds]);

  useEffect(() => {
    localStorage.setItem('requested_coins', JSON.stringify(requestedCoins));
  }, [requestedCoins]);

  const toggleCollected = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const denominations = useMemo(() => {
    const unique = Array.from(new Set(UK_COINS.map(c => c.denomination)));
    const order = ['£2', '£1', 'Half Crown', '1 Shilling', '50p', '3p', '1p', '1/2p'];
    return unique.sort((a, b) => {
      const indexA = order.indexOf(a);
      const indexB = order.indexOf(b);
      if (indexA === -1 && indexB === -1) return a.localeCompare(b);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
  }, []);

  const filteredCoins = useMemo(() => {
    return UK_COINS.filter(coin => {
      const matchesSearch = coin.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           coin.denomination.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filter === 'all' || 
                           (filter === 'collected' && collectedIds.includes(coin.id)) ||
                           (filter === 'missing' && !collectedIds.includes(coin.id));
      const matchesDenom = activeDenomination ? coin.denomination === activeDenomination : true;
      
      return matchesSearch && matchesFilter && matchesDenom;
    });
  }, [searchQuery, filter, collectedIds, activeDenomination]);

  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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

  const progress = Math.round((collectedIds.length / UK_COINS.length) * 100);
  const showFolders = !activeDenomination && searchQuery === '' && activeDenomination !== 'Wishlist';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 px-4 py-4 sm:px-6">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {(activeDenomination || activeDenomination === 'Wishlist') && (
              <button 
                onClick={() => setActiveDenomination(null)}
                className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Back to folders"
              >
                <ArrowLeft size={24} />
              </button>
            )}
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <Trophy className="text-amber-500" size={28} />
              {activeDenomination ? activeDenomination : 'Coin Collector'}
            </h1>
          </div>
          <button 
            onClick={() => setIsRequestModalOpen(true)}
            className="bg-amber-500 text-white p-2 rounded-full shadow-lg shadow-amber-200 hover:bg-amber-600 transition-colors"
            title="Request a new coin"
          >
            <Plus size={24} />
          </button>
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
      <div className="p-4 bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text"
              placeholder="Search all coins..."
              className="w-full pl-10 pr-4 py-3 bg-gray-100 border-none rounded-xl text-lg focus:ring-2 focus:ring-amber-500 outline-none transition-all"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value !== '') setActiveDenomination(null);
              }}
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {(['all', 'collected', 'missing'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wide whitespace-nowrap transition-colors ${
                  filter === f 
                    ? 'bg-gray-900 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 overflow-y-auto">
        <div className="max-w-2xl mx-auto grid gap-4">
          <AnimatePresence mode="popLayout">
            {showFolders ? (
              /* Folder View */
              <>
                {denominations.map((denom) => {
                  const coinsInDenom = UK_COINS.filter(c => c.denomination === denom);
                  const collectedInDenom = coinsInDenom.filter(c => collectedIds.includes(c.id)).length;
                  const denomProgress = Math.round((collectedInDenom / coinsInDenom.length) * 100);

                  return (
                    <motion.div
                      key={denom}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      onClick={() => setActiveDenomination(denom)}
                      className="bg-white rounded-2xl p-5 shadow-sm border-2 border-transparent hover:border-amber-500 transition-all cursor-pointer flex items-center gap-4"
                    >
                      <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center">
                        <Folder size={32} fill="currentColor" fillOpacity={0.2} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900">Coin {denom}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-amber-500" 
                              style={{ width: `${denomProgress}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-gray-500">{collectedInDenom}/{coinsInDenom.length}</span>
                        </div>
                      </div>
                      <ChevronRight className="text-gray-300" size={24} />
                    </motion.div>
                  );
                })}

                {/* Wishlist Folder */}
                {requestedCoins.length > 0 && (
                  <motion.div
                    key="Wishlist"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => setActiveDenomination('Wishlist')}
                    className="bg-white rounded-2xl p-5 shadow-sm border-2 border-dashed border-amber-300 hover:border-amber-500 transition-all cursor-pointer flex items-center gap-4"
                  >
                    <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center">
                      <Folder size={32} fill="currentColor" fillOpacity={0.1} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 italic">My Wishlist</h3>
                      <p className="text-sm text-gray-500">{requestedCoins.length} coins requested</p>
                    </div>
                    <ChevronRight className="text-gray-300" size={24} />
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
              filteredCoins.map((coin) => {
                const isCollected = collectedIds.includes(coin.id);
                return (
                  <motion.div
                    layout
                    key={coin.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={() => setSelectedCoin(coin)}
                    className={`group relative bg-white rounded-2xl p-4 shadow-sm border-2 transition-all cursor-pointer ${
                      isCollected ? 'border-amber-500 bg-amber-50/30' : 'border-transparent'
                    }`}
                  >
                    <div className="flex gap-4 items-center">
                      <div className="relative w-20 h-20 flex-shrink-0">
                        <img 
                          src={coin.imageUrl} 
                          alt={coin.name}
                          referrerPolicy="no-referrer"
                          className={`w-full h-full object-cover rounded-full border-2 border-gray-100 ${
                            !isCollected && 'grayscale opacity-50'
                          }`}
                        />
                        {isCollected && (
                          <div className="absolute -top-1 -right-1 bg-amber-500 text-white rounded-full p-1 shadow-md">
                            <CheckCircle2 size={16} />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-amber-600 uppercase tracking-widest">
                            {coin.denomination} • {coin.year}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 truncate">{coin.name}</h3>
                        <p className="text-sm text-gray-500 line-clamp-1">{coin.description}</p>
                      </div>

                      <button
                        onClick={(e) => toggleCollected(coin.id, e)}
                        className={`p-3 rounded-xl transition-all ${
                          isCollected 
                            ? 'bg-amber-500 text-white shadow-lg shadow-amber-200' 
                            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                        }`}
                        aria-label={isCollected ? "Mark as missing" : "Mark as collected"}
                      >
                        {isCollected ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                      </button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>

          {!showFolders && filteredCoins.length === 0 && activeDenomination !== 'Wishlist' && (
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
              className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Request a Coin</h2>
                <button onClick={() => setIsRequestModalOpen(false)} className="text-gray-400">
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={handleRequestSubmit} className="space-y-6">
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

                <button
                  type="submit"
                  className="w-full py-4 bg-amber-500 text-white rounded-2xl text-xl font-bold shadow-xl shadow-amber-200 hover:bg-amber-600 transition-all flex items-center justify-center gap-2"
                >
                  <Send size={20} /> Submit Request
                </button>
              </form>
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
              onClick={() => setSelectedCoin(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="relative h-64 sm:h-80">
                <img 
                  src={selectedCoin.imageUrl} 
                  alt={selectedCoin.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <button 
                  onClick={() => setSelectedCoin(null)}
                  className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-colors"
                >
                  <X size={24} />
                </button>
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent text-white">
                  <span className="text-sm font-bold uppercase tracking-widest text-amber-400">
                    {selectedCoin.denomination} • {selectedCoin.year}
                  </span>
                  <h2 className="text-3xl font-bold">{selectedCoin.name}</h2>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Info size={14} /> Description
                  </h4>
                  <p className="text-lg text-gray-700 leading-relaxed">
                    {selectedCoin.description}
                  </p>
                </div>

                <button
                  onClick={(e) => {
                    toggleCollected(selectedCoin.id, e as any);
                    setSelectedCoin(null);
                  }}
                  className={`w-full py-4 rounded-2xl text-xl font-bold shadow-xl transition-all flex items-center justify-center gap-3 ${
                    collectedIds.includes(selectedCoin.id)
                      ? 'bg-gray-100 text-gray-600'
                      : 'bg-amber-500 text-white shadow-amber-200'
                  }`}
                >
                  {collectedIds.includes(selectedCoin.id) ? (
                    <>
                      <CheckCircle2 size={24} /> Mark as Missing
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={24} /> Mark as Collected
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer / Safe Area Spacer for iOS */}
      <div className="h-4 sm:hidden" />
    </div>
  );
}
