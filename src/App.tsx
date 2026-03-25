import React, { useState, useEffect, useMemo } from 'react';
import { Search, Trophy, CheckCircle2, Circle, Info, Filter, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UK_COINS, Coin } from './data/coins';

export default function App() {
  const [collectedIds, setCollectedIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('collected_coins');
    return saved ? JSON.parse(saved) : [];
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'collected' | 'missing'>('all');
  const [selectedCoin, setSelectedCoin] = useState<Coin | null>(null);

  useEffect(() => {
    localStorage.setItem('collected_coins', JSON.stringify(collectedIds));
  }, [collectedIds]);

  const toggleCollected = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const filteredCoins = useMemo(() => {
    return UK_COINS.filter(coin => {
      const matchesSearch = coin.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           coin.denomination.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filter === 'all' || 
                           (filter === 'collected' && collectedIds.includes(coin.id)) ||
                           (filter === 'missing' && !collectedIds.includes(coin.id));
      return matchesSearch && matchesFilter;
    });
  }, [searchQuery, filter, collectedIds]);

  const progress = Math.round((collectedIds.length / UK_COINS.length) * 100);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 px-4 py-4 sm:px-6">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Trophy className="text-amber-500" size={28} />
            Coin Collector
          </h1>
          <div className="text-right">
            <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">Progress</div>
            <div className="text-xl font-bold text-gray-900">{progress}%</div>
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
      <div className="p-4 bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text"
              placeholder="Search coins (e.g. 50p, Kew...)"
              className="w-full pl-10 pr-4 py-3 bg-gray-100 border-none rounded-xl text-lg focus:ring-2 focus:ring-amber-500 outline-none transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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

      {/* Coin List */}
      <main className="flex-1 p-4 overflow-y-auto">
        <div className="max-w-2xl mx-auto grid gap-4">
          <AnimatePresence mode="popLayout">
            {filteredCoins.map((coin) => {
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
            })}
          </AnimatePresence>

          {filteredCoins.length === 0 && (
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
                      <Circle size={24} /> Mark as Missing
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
