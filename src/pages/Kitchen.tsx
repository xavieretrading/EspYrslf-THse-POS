import React, { useEffect, useState, useRef } from 'react';
import { Clock, CheckCircle, Flame, Volume2, VolumeX, ExternalLink, Maximize, Minimize, Archive } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../App';
import { useBranch } from '../BranchContext';

type KDSItem = {
  id: number;
  order_id: number;
  product_name: string;
  category_name?: string;
  quantity: number;
  status: string;
  notes: string;
  table_name: string;
  order_time: string;
  order_status: string;
  is_complimentary?: boolean;
};

type Category = {
  id: number;
  name: string;
};

// Simple synthesizer for notification sound
const playNotificationSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    // Resume context if needed (browsers might suspend it)
    const audioCtx = new AudioContext();
    
    const playTone = (freq: number, startTime: number, duration: number) => {
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime + startTime);
      
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime + startTime);
      gainNode.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + startTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + startTime + duration);
      
      oscillator.start(audioCtx.currentTime + startTime);
      oscillator.stop(audioCtx.currentTime + startTime + duration);
    };

    // Ding-dong sound - repeated to last 5 seconds
    for (let i = 0; i < 5; i++) {
        const offset = i * 1.0; // Play every second
        playTone(880.00, offset, 0.4); // A5
        playTone(1108.73, offset + 0.15, 0.6); // C#6
    }
  } catch (e) {
    console.error("Audio playback failed", e);
  }
};

export default function Kitchen() {
  const { activeBranch } = useBranch();
  const [items, setItems] = useState<KDSItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => {
        // Filter categories to be unique by name
        const uniqueCategories = (data || []).filter((cat: Category, index: number, self: Category[]) => 
          self.findIndex(t => t.name === cat.name) === index
        );
        setCategories(uniqueCategories);
      });
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };
  
  const knownItemIds = useRef<Set<number>>(new Set());
  const initialLoadDone = useRef(false);

  const fetchItems = () => {
    if (!activeBranch) return;
    fetch(`/api/kds?branch_id=${activeBranch.id}`)
      .then(res => res.json())
      .then((data: KDSItem[]) => {
        setItems(data);
        
        // Check for new items in 'ordered' state
        if (initialLoadDone.current) {
          const orderedItems = data.filter(i => i.status === 'ordered');
          let hasNew = false;
          
          orderedItems.forEach(item => {
            if (!knownItemIds.current.has(item.id)) {
              hasNew = true;
            }
          });
          
          if (hasNew && soundEnabled) {
            playNotificationSound();
          }
        }
        
        // Update known IDs
        const newKnownIds = new Set<number>();
        data.forEach(item => newKnownIds.add(item.id));
        knownItemIds.current = newKnownIds;
        
        initialLoadDone.current = true;
      });
  };

  useEffect(() => {
    initialLoadDone.current = false;
    knownItemIds.current = new Set();
    fetchItems();
    const interval = setInterval(fetchItems, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, [activeBranch, soundEnabled]);

  const updateStatus = async (id: number, status: string) => {
    await fetch(`/api/kds/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    fetchItems();
  };

  const filteredItems = items.filter(i => 
    selectedCategories.length === 0 || (i.category_name && selectedCategories.includes(i.category_name))
  );

  const orderedItems = filteredItems.filter(i => i.status === 'ordered');
  const cookingItems = filteredItems.filter(i => i.status === 'cooking');
  const servedItems = filteredItems.filter(i => i.status === 'served');

  const ItemCard: React.FC<{ item: KDSItem, actionText?: string, actionStatus?: string, actionColor?: string, icon?: any }> = ({ item, actionText, actionStatus, actionColor, icon: Icon }) => {
    const isDineInMarker = item.notes?.includes('[DINE-IN]');
    const isVoucher = item.notes?.includes('(Voucher)');
    const displayNotes = item.notes?.replace('[DINE-IN] ', '').replace('[DINE-IN]', '').replace(/\(Complimentary Voucher\)\s*/g, '').replace(/\(Voucher\)\s*/g, '').replace(/\[COMPLIMENTARY:.*?\]/g, '').replace(/\[COMPLIMENTARY\]/g, '').trim();
    const isDineIn = item.table_name || isDineInMarker || isVoucher;

    return (
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col gap-3">
        <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[13px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  ORD #{item.order_number || item.order_id}
                </span>
                <span className={cn(
                  "text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-md", 
                  isDineIn ? "bg-indigo-100 text-indigo-600" : "bg-orange-100 text-orange-600"
                )}>
                  {isDineIn ? (item.table_name ? `Dine In - ${item.table_name}` : 'Walk-In') : 'Takeaway'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {item.category_name && (
                  <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 uppercase">
                    {item.category_name}
                  </span>
                )}
              {item.order_status === 'paid' && (
                <span className="text-[10px] bg-emerald-100 text-emerald-700 font-black px-1.5 py-0.5 rounded border border-emerald-200">
                  PAID
                </span>
              )}
            </div>
            <h3 className="font-bold text-lg text-slate-900 mt-2">
              {item.quantity}x {item.product_name}
              {item.notes?.includes('(Voucher)') && (
                <span className="ml-2 inline-block px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded border border-emerald-200 align-middle">
                  VOUCHER
                </span>
              )}
              {item.is_complimentary && (
                <span className="ml-2 inline-block px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-black rounded border border-amber-200 align-middle">
                  COMPLIMENTARY
                </span>
              )}
            </h3>
          </div>
        <div className="text-right">
          <span className="text-xs text-slate-400 flex items-center gap-1 justify-end">
            <Clock size={12} />
            {formatDistanceToNow(new Date(item.order_time))} ago
          </span>
        </div>
      </div>
      
      {displayNotes && displayNotes !== '' && (
        <div className="mt-2 text-xs font-bold text-amber-900 bg-amber-100 p-3 rounded-lg border-l-4 border-amber-400 shadow-sm -rotate-1 flex flex-col gap-1">
          <div className="text-[10px] uppercase font-black opacity-50">Note</div>
          {displayNotes}
        </div>
      )}

      {actionStatus && actionText && Icon && (
        <button
          onClick={() => updateStatus(item.id, actionStatus)}
          className={cn(
            "mt-auto w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]",
            actionColor
          )}
        >
          <Icon size={18} />
          {actionText}
        </button>
      )}
    </div>
  );
};

  const popOut = () => {
    window.open('/standalone-kitchen', '_blank', 'width=1200,height=800');
  };

  return (
    <div className="p-3 md:p-6 h-screen flex flex-col bg-slate-50 font-sans">
      <div className="mb-4 md:mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3 md:gap-4 w-full sm:w-auto">
          <div className="pl-12 lg:pl-0">
            <h1 className="text-xl md:text-3xl font-black text-slate-900 tracking-tight">Espresso Bar Display</h1>
            <p className="text-xs md:text-sm text-slate-500 font-medium">Live Order Management</p>
          </div>
          <div className="flex items-center gap-1.5 ml-auto sm:ml-0 flex-wrap">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 lg:ml-4">
              <button 
                onClick={() => setSelectedCategories([])}
                className={cn(
                  "px-3 py-1.5 rounded-full text-[10px] font-black transition-all border whitespace-nowrap",
                  selectedCategories.length === 0 
                    ? "bg-slate-900 text-white border-slate-900" 
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                )}
              >
                ALL
              </button>
              {categories.map(cat => (
                <button 
                  key={cat.id}
                  onClick={() => {
                    if (selectedCategories.includes(cat.name)) {
                      setSelectedCategories(selectedCategories.filter(c => c !== cat.name));
                    } else {
                      setSelectedCategories([...selectedCategories, cat.name]);
                    }
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-[10px] font-black transition-all border whitespace-nowrap uppercase",
                    selectedCategories.includes(cat.name) 
                      ? "bg-emerald-500 text-white border-emerald-600" 
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>
            {window.location.pathname !== '/standalone-kitchen' && (
              <button onClick={popOut} className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl flex items-center justify-center shadow-sm min-w-[44px] min-h-[44px]" title="Open KDS in new window">
                <ExternalLink size={20} />
              </button>
            )}
            <button onClick={toggleFullscreen} className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl flex items-center justify-center shadow-sm min-w-[44px] min-h-[44px]" title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}>
              {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
            </button>
          </div>
        </div>
        <button 
          onClick={() => {
              setSoundEnabled(!soundEnabled);
              if (!soundEnabled) playNotificationSound();
          }}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black transition-all border w-full sm:w-auto justify-center min-h-[44px]",
            soundEnabled 
              ? "bg-white border-slate-200 text-slate-700 shadow-sm" 
              : "bg-slate-100 border-transparent text-slate-400"
          )}
        >
          {soundEnabled ? <Volume2 size={18} className="text-emerald-500" /> : <VolumeX size={18} />}
          {soundEnabled ? 'ALERTS ON' : 'ALERTS MUTED'}
        </button>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 overflow-hidden min-h-0">
        {/* New Orders */}
        <div className="flex flex-col min-h-0 bg-slate-100/50 rounded-3xl p-4 md:p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg md:text-xl font-black text-slate-900 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500 animate-pulse"></span>
              NEW ORDERS
            </h2>
            <span className="bg-white border border-slate-200 text-slate-900 px-3 py-1 rounded-lg text-sm font-black shadow-sm">{orderedItems.length}</span>
          </div>
          <div className="flex-1 overflow-auto space-y-3 md:space-y-4 pr-1 custom-scrollbar">
            {orderedItems.map(item => (
              <ItemCard 
                key={item.id} 
                item={item} 
                actionText="START COOKING" 
                actionStatus="cooking" 
                actionColor="bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/30 border-b-4 border-amber-700"
                icon={Flame}
              />
            ))}
            {orderedItems.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 py-12">
                 <CheckCircle size={48} className="opacity-10 mb-2" />
                 <p className="font-bold">No new orders</p>
              </div>
            )}
          </div>
        </div>

        {/* Cooking */}
        <div className="flex flex-col min-h-0 bg-slate-100/50 rounded-3xl p-4 md:p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg md:text-xl font-black text-slate-900 flex items-center gap-2">
              <Flame className="text-orange-500" />
              NOW COOKING
            </h2>
            <span className="bg-white border border-slate-200 text-slate-900 px-3 py-1 rounded-lg text-sm font-black shadow-sm">{cookingItems.length}</span>
          </div>
          <div className="flex-1 overflow-auto space-y-3 md:space-y-4 pr-1 custom-scrollbar">
            {cookingItems.map(item => (
              <ItemCard 
                key={item.id} 
                item={item} 
                actionText="MARK AS SERVED" 
                actionStatus="served" 
                actionColor="bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 border-b-4 border-emerald-700"
                icon={CheckCircle}
              />
            ))}
            {cookingItems.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 py-12">
                 <Flame size={48} className="opacity-10 mb-2" />
                 <p className="font-bold">Nothing cooking</p>
              </div>
            )}
          </div>
        </div>

        {/* Served */}
        <div className="flex flex-col min-h-0 bg-slate-100/50 rounded-3xl p-4 md:p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg md:text-xl font-black text-slate-900 flex items-center gap-2">
              <CheckCircle className="text-emerald-500" />
              SERVED ITEMS
            </h2>
            <span className="bg-white border border-slate-200 text-slate-900 px-3 py-1 rounded-lg text-sm font-black shadow-sm">{servedItems.length}</span>
          </div>
          <div className="flex-1 overflow-auto space-y-3 md:space-y-4 pr-1 custom-scrollbar">
            {servedItems.map(item => (
              <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-emerald-100 flex flex-col gap-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-2 h-full bg-emerald-500/10"></div>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[13px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        ORD #{item.order_number || item.order_id}
                      </span>
                      <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 uppercase inline-block">
                        {item.table_name ? `TABLE ${item.table_name}` : (item.notes?.includes('[DINE-IN]') || item.notes?.includes('(Voucher)') ? 'WALK-IN' : 'TAKEAWAY')}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900">
                      {item.quantity}x {item.product_name}
                      {item.is_complimentary && (
                        <span className="ml-2 inline-block px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-black rounded border border-amber-200 align-middle">
                          COMPLIMENTARY
                        </span>
                      )}
                    </h3>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Order Time</p>
                    <p className="text-[11px] font-black text-slate-600">{new Date(item.order_time).toLocaleDateString()} {new Date(item.order_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
                {item.notes && item.notes.replace(/\(Complimentary Voucher\)\s*/g, '').replace(/\(Voucher\)\s*/g, '').replace(/\[COMPLIMENTARY:.*?\]/g, '').replace(/\[COMPLIMENTARY\]/g, '').trim() !== '' && (
                  <div className="mt-2 text-[10px] font-bold text-amber-900 bg-amber-100 p-3 rounded-lg border-l-4 border-amber-400 shadow-sm rotate-1">
                    {item.notes.replace(/\(Complimentary Voucher\)\s*/g, '').replace(/\(Voucher\)\s*/g, '').replace(/\[COMPLIMENTARY:.*?\]/g, '').replace(/\[COMPLIMENTARY\]/g, '')}
                  </div>
                )}
                <button
                  onClick={() => updateStatus(item.id, 'archived')}
                  className="mt-2 w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all border border-slate-200"
                >
                  <Archive size={14} />
                  ARCHIVE ITEM
                </button>
              </div>
            ))}
            {servedItems.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 py-12">
                 <CheckCircle size={48} className="opacity-10 mb-2" />
                 <p className="font-bold">No items served yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
