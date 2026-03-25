import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Trophy, Search, Folder, ChevronRight, CheckCircle2, Circle, 
  ArrowLeft, Info, X, Plus, Send, Clipboard, Camera, Loader2, Sparkles
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

export default function App() {
  const [collectedIds, setCollectedIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('collected_coins');
    return saved ? JSON.parse(saved) : [];
  });
  const [customCoins, setCustomCoins] = useState<Coin[]>(() => {
    const saved = localStorage.getItem('custom_coins');
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
  const [reqName, setReqName] = useState('');
  const [reqDenom, setReqDenom] = useState('50p');
  const [reqYear, setReqYear] = useState(new Date().getFullYear());
  const [reqPhoto, setReqPhoto] = useState<string | null>(null);
  const [isAddingToCollection, setIsAddingToCollection] = useState(false);

  const [isZoomed, setIsZoomed] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scanResult, setScanResult] = useState<{ denomination: string; year: number | null; photo?: string } | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem('collected_coins', JSON.stringify(collectedIds));
  }, [collectedIds]);

  useEffect(() => {
    localStorage.setItem('custom_coins', JSON.stringify(customCoins));
  }, [customCoins]);

  useEffect(() => {
    localStorage.setItem('requested_coins', JSON.stringify(requestedCoins));
  }, [requestedCoins]);

  const allCoins = useMemo(() => [...UK_COINS, ...customCoins], [customCoins]);

  const toggleCollected = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const denominations = useMemo(() => {
    const unique = Array.from(new Set(allCoins.map(c => c.denomination))) as string[];
    const order = ['£2', '£1', 'Half Crown', '1 Shilling', '50p', '3p', '1p', '1/2p'];
    return unique.sort((a, b) => {
      const indexA = order.indexOf(a);
      const indexB = order.indexOf(b);
      if (indexA === -1 && indexB === -1) return a.localeCompare(b);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
  }, [allCoins]);

  const filteredCoins = useMemo(() => {
    return allCoins.filter(coin => {
      const matchesSearch = coin.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           coin.denomination.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filter === 'all' || 
                           (filter === 'collected' && collectedIds.includes(coin.id)) ||
                           (filter === 'missing' && !collectedIds.includes(coin.id));
      const matchesDenom = activeDenomination ? coin.denomination === activeDenomination : true;
      
      return matchesSearch && matchesFilter && matchesDenom;
    });
  }, [searchQuery, filter, collectedIds, activeDenomination, allCoins]);

  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isAddingToCollection) {
      const newCoin: Coin = {
        id: `custom-${Date.now()}`,
        name: reqName || `${reqDenom} (${reqYear})`,
        denomination: reqDenom,
        year: reqYear,
        description: 'Custom added coin.',
        imageUrl: reqPhoto || `https://picsum.photos/seed/custom-${reqDenom}-${reqYear}/600/600`
      };
      setCustomCoins(prev => [...prev, newCoin]);
      setCollectedIds(prev => [...prev, newCoin.id]);
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
    const reader = new FileReader();
    reader.onload = async (event) => {
      const img = new Image();
      img.onload = async () => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Resize for analysis
        const maxDim = 800;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDim) {
            height *= maxDim / width;
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width *= maxDim / height;
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        const base64Image = canvas.toDataURL('image/jpeg', 0.6).split(',')[1];
        const fullPhoto = canvas.toDataURL('image/jpeg', 0.6);

        try {
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
            setCollectedIds(prev => prev.includes(foundCoin.id) ? prev : [...prev, foundCoin.id]);
            setSelectedCoin(foundCoin);
          } else {
            const newCoin: Coin = {
              id: `custom-${Date.now()}`,
              name: result.name && result.name !== 'unknown' ? result.name : `${result.denomination} (${result.year || 'Unknown Year'})`,
              denomination: result.denomination !== 'unknown' ? result.denomination : 'Custom',
              year: result.year || new Date().getFullYear(),
              description: 'Automatically identified via photo.',
              imageUrl: fullPhoto
            };
            setCustomCoins(prev => [...prev, newCoin]);
            setCollectedIds(prev => [...prev, newCoin.id]);
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
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
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
      const base64Image = canvas.toDataURL('image/jpeg', 0.6).split(',')[1];
      const fullPhoto = canvas.toDataURL('image/jpeg', 0.6);
      
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
          setSelectedCoin(foundCoin);
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

  const progress = Math.round((collectedIds.length / allCoins.length) * 100);
  const showFolders = !activeDenomination && searchQuery === '' && activeDenomination !== 'Wishlist';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 px-4 py-4 sm:px-6">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {(activeDenomination || activeDenomination === 'Wishlist') && (
              <button 
                onClick={() => {
                  setActiveDenomination(null);
                  setIsZoomed(false);
                }}
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
          <div className="flex gap-2">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="bg-amber-500 text-white p-2 rounded-full shadow-lg hover:bg-amber-600 transition-colors flex items-center gap-2 px-4"
              title="Take a photo of a coin"
            >
              <Camera size={24} />
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
              className="bg-gray-900 text-white p-2 rounded-full shadow-lg hover:bg-black transition-colors"
              title="Manual Request"
            >
              <Plus size={24} />
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
                    className="absolute bottom-32 left-6 right-6 bg-white rounded-2xl p-4 shadow-2xl"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Identified As</h4>
                        <p className="text-xl font-bold text-gray-900">
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
                          className="px-4 py-2 bg-amber-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-amber-200"
                        >
                          Add to Collection
                        </button>
                        <button 
                          onClick={() => {
                            setIsAddingToCollection(false);
                            setIsRequestModalOpen(true);
                            stopScanner();
                          }}
                          className="px-4 py-2 bg-amber-100 text-amber-600 rounded-xl font-bold text-sm"
                        >
                          Request
                        </button>
                        <button 
                          onClick={() => setScanResult(null)}
                          className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl font-bold text-sm"
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
                        <img src={reqPhoto} alt="Captured" className="w-full h-full object-cover" />
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
              <div className={`relative transition-all duration-500 ${isZoomed ? 'h-full' : 'h-64 sm:h-80'}`}>
                <img 
                  src={selectedCoin.imageUrl} 
                  alt={selectedCoin.name}
                  referrerPolicy="no-referrer"
                  onClick={() => setIsZoomed(!isZoomed)}
                  className={`w-full h-full object-cover cursor-zoom-in transition-transform duration-500 ${
                    isZoomed ? 'object-contain bg-black cursor-zoom-out' : ''
                  }`}
                />
                <button 
                  onClick={() => {
                    setSelectedCoin(null);
                    setIsZoomed(false);
                  }}
                  className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-colors z-10"
                >
                  <X size={24} />
                </button>
                {!isZoomed && (
                  <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent text-white">
                    <span className="text-sm font-bold uppercase tracking-widest text-amber-400">
                      {selectedCoin.denomination} • {selectedCoin.year}
                    </span>
                    <h2 className="text-3xl font-bold">{selectedCoin.name}</h2>
                    <p className="text-xs mt-1 opacity-70">Tap image to compare / zoom</p>
                  </div>
                )}
              </div>
              
              {!isZoomed && (
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
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer / Safe Area Spacer for iOS */}
      <div className="h-4 sm:hidden" />
    </div>
  );
}
