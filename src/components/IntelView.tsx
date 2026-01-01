'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, Flame, Target, Crown, 
  Lock, Map as MapIcon, Shield, Zap, 
  Calendar, BarChart3, Ghost, 
  Feather, Scroll, Sprout, Sun, Moon,
  Droplets, Mountain, Compass, Sparkles,
  Wheat, Warehouse, Trees, BookOpen
} from 'lucide-react';

// --- TYPES ---
type Topic = {
  id: string;
  title: string;
  category: string;
  status: string;
  created_at: string;
  next_review: string;
  last_gap: number;
};

type IntelProps = {
  topics: Topic[];
  profile: any;
};

// --- 1. HELPER: STREAK ENGINE ---
const calculateStreak = (topics: Topic[]) => {
  if (!topics.length) return 0;
  
  // Get unique dates
  const dates = Array.from(new Set(topics.map(t => new Date(t.created_at).toDateString())))
    .map(d => new Date(d).getTime())
    .sort((a, b) => b - a);

  if (dates.length === 0) return 0;
  
  const today = new Date().setHours(0,0,0,0);
  const yesterday = today - 86400000;
  
  // If last entry is older than yesterday, streak is broken
  if (dates[0] < yesterday) return 0;

  let streak = 1;
  for (let i = 0; i < dates.length - 1; i++) {
    if (dates[i] - dates[i+1] === 86400000) streak++;
    else break;
  }
  return streak;
};

// --- 2. HELPER: OFFLINE BOTANIST (AI LOGIC) ---
const getBotanistInsight = (topics: Topic[], streak: number) => {
  const hour = new Date().getHours();
  const overdue = topics.filter(t => new Date(t.next_review) <= new Date()).length;
  const active = topics.filter(t => t.status === 'active').length;
  const completed = topics.filter(t => t.status === 'completed').length;
  
  if (overdue > 10) return "CRITICAL: The archive is decaying. 10+ specimens require immediate stabilization.";
  if (overdue > 5) return "Advisory: Weed growth detected. Clear the overdue list to maintain order.";
  if (hour >= 0 && hour < 5) return "Log: Nocturnal activity detected. Bioluminescence levels stable in the archive.";
  if (hour >= 5 && hour < 8) return "Log: Early morning conditions optimal. The mind is most fertile at dawn.";
  if (streak > 30) return "Status: THRIVING. The root systems are deep. Entropy has been halted.";
  if (streak > 7) return "Status: STABLE. Consistency is compounding. Keep the rhythm.";
  if (completed > 50) return "Report: Archive capacity exceeding expectations. Mastery imminent.";
  if (active < 3 && completed < 5) return "Analysis: The field is barren. Plant more seeds to begin the cycle.";
  
  const defaults = [
    "Observation: Nature does not hurry, yet everything is accomplished.",
    "Field Note: Consistency outperforms intensity in 99% of trials.",
    "Status: Archives secure. Ready for inspection.",
    "Log: Every seed planted today is shade for tomorrow."
  ];
  return defaults[Math.floor(Math.random() * defaults.length)];
};

// --- 3. BADGE DEFINITIONS (20 Stamps) ---
const getBadges = (topics: Topic[], streak: number) => [
  // GROWTH
  { id: 'germination', name: 'Germination', desc: 'First seed planted', icon: Sprout, tier: 'copper', req: topics.length >= 1 },
  { id: 'photo', name: 'Photosynthesis', desc: '3 Day Streak', icon: Sun, tier: 'copper', req: streak >= 3 },
  { id: 'sapling', name: 'The Sapling', desc: '7 Day Streak', icon: Trees, tier: 'silver', req: streak >= 7 },
  { id: 'oak', name: 'The Oak', desc: '30 Day Streak', icon: Shield, tier: 'gold', req: streak >= 30 },
  { id: 'evergreen', name: 'The Evergreen', desc: '100 Day Streak', icon: Mountain, tier: 'platinum', req: streak >= 100 },
  
  // COLLECTION
  { id: 'forager', name: 'The Forager', desc: '10 Topics Cataloged', icon: MapIcon, tier: 'copper', req: topics.length >= 10 },
  { id: 'collector', name: 'The Collector', desc: '50 Topics Cataloged', icon: Scroll, tier: 'silver', req: topics.length >= 50 },
  { id: 'curator', name: 'The Curator', desc: '100 Topics Cataloged', icon: Feather, tier: 'gold', req: topics.length >= 100 },
  { id: 'archivist', name: 'The Archivist', desc: '500 Topics Cataloged', icon: Warehouse, tier: 'platinum', req: topics.length >= 500 },

  // MASTERY
  { id: 'harvest', name: 'First Harvest', desc: '1 Topic Mastered', icon: Target, tier: 'copper', req: topics.some(x => x.status === 'completed') },
  { id: 'yield', name: 'Bountiful Yield', desc: '10 Topics Mastered', icon: Wheat, tier: 'silver', req: topics.filter(x => x.status === 'completed').length >= 10 },
  { id: 'granary', name: 'Full Granary', desc: '50 Topics Mastered', icon: Warehouse, tier: 'gold', req: topics.filter(x => x.status === 'completed').length >= 50 },
  { id: 'vajra', name: 'The Vajra', desc: '100% Mastery (Min 20)', icon: Zap, tier: 'platinum', req: topics.length >= 20 && topics.every(t => t.status === 'completed') },

  // HABITS
  { id: 'early', name: 'Early Dew', desc: 'Planted before 7AM', icon: Droplets, tier: 'silver', req: topics.some(x => new Date(x.created_at).getHours() < 7) },
  { id: 'night', name: 'Night Watch', desc: 'Planted after 10PM', icon: Moon, tier: 'silver', req: topics.some(x => new Date(x.created_at).getHours() >= 22) },
  { id: 'polymath', name: 'Polymath', desc: '3+ Categories Active', icon: Compass, tier: 'gold', req: new Set(topics.map(x => x.category)).size >= 3 },
  { id: 'sentinel', name: 'The Sentinel', desc: 'Zero Overdue Topics', icon: Shield, tier: 'gold', req: topics.length > 5 && !topics.some(t => new Date(t.next_review) <= new Date()) },

  // LEGENDARY
  { id: 'botanist', name: 'Head Botanist', desc: 'Level 20 Reached', icon: Crown, tier: 'platinum', req: false }, 
];

// --- MAIN COMPONENT ---
export default function IntelView({ topics, profile }: IntelProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<any>(null);

    // --- ACCESS CONTROL ---
  const userTier = profile?.tier ?? 'free';
  const isAdmin = profile?.is_admin === true;
  const isProOrAdmin = userTier === 'pro' || isAdmin;
  console.log('INTEL PROFILE DEBUG FINAL:', {
    profile,
    isAdmin,
    userTier,
  }); 


  
  // AI STATE
  const [aiLoading, setAiLoading] = useState(false);
  const [aiReport, setAiReport] = useState<string | null>(null);

  // 1. STATS CALCULATION
  const calculateStats = () => {
    let xp = 0;
    topics.forEach(t => xp += (t.status === 'completed' ? 50 : 10));
    let level = 1;
    let reqXp = 100;
    while (xp >= reqXp && level < 50) {
      xp -= reqXp;
      level++;
      reqXp = Math.floor(reqXp * 1.5);
    }
    return { xp, level, reqXp };
  };
  const stats = calculateStats();
  const progressPercent = (stats.xp / stats.reqXp) * 100;

  // 2. STREAK & BADGES
  const currentStreak = calculateStreak(topics);
  const badges = getBadges(topics, currentStreak);
  const botanistBadge = badges.find(b => b.id === 'botanist');
  if (botanistBadge) botanistBadge.req = stats.level >= 20;

  // 3. FORECAST ENGINE
  const getForecast = () => {
    const forecast = new Array(7).fill(0);
    const today = new Date();
    topics.forEach(t => {
      if(t.status === 'completed' || !t.next_review) return;
      const reviewDate = new Date(t.next_review);
      const diffDays = Math.ceil((reviewDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
      if (diffDays >= 0 && diffDays < 7) forecast[diffDays]++;
    });
    return forecast;
  };
  const forecast = getForecast();
  const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const todayIndex = new Date().getDay();

  // 4. HANDLERS
  const handleConsultBotanist = () => {
    setAiLoading(true);
    setTimeout(() => {
      const insight = getBotanistInsight(topics, currentStreak);
      setAiReport(insight);
      setAiLoading(false);
    }, 1500);
  };

  const triggerConfetti = (badge: any) => {
    setSelectedBadge(badge);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
  };

  // --- THEME: MIDNIGHT ARCHIVE ---
  // We use negative margins (-m) to stretch full width if inside a padded container
  return (
    <div className="w-full -mt-8 min-h-screen bg-[#0f0e0e] text-stone-300 font-sans p-4 md:p-8 rounded-xl shadow-2xl relative overflow-hidden">
      
      {/* Background Texture (Subtle Noise) */}
      <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] pointer-events-none"></div>

      {/* CONFETTI OVERLAY */}
      <AnimatePresence>
        {showConfetti && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[500] pointer-events-none flex items-center justify-center">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-md"></div>
            <div className="relative z-10 text-center animate-bounce">
              <div className="w-32 h-32 mx-auto bg-[#FDFBF7] rounded-full flex items-center justify-center border-4 border-amber-500 shadow-[0_0_50px_rgba(245,158,11,0.5)]">
                 <selectedBadge.icon size={64} className="text-stone-900"/>
              </div>
              <h2 className="text-4xl font-black text-white mt-6 tracking-widest font-serif">DISCOVERY</h2>
              <p className="text-xl text-amber-400 font-bold mt-2 font-mono uppercase">{selectedBadge?.name}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- HEADER: THE ID CARD --- */}
      <div className="flex flex-col md:flex-row gap-6 mb-12 relative z-10">
        <div className="flex-1 bg-[#1c1917] border border-stone-800 p-6 rounded-lg shadow-lg relative overflow-hidden group">
          <div className="flex justify-between items-start relative z-10">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500 mb-1">Clearance Level</div>
              <h1 className="text-3xl md:text-4xl font-black font-serif text-white">
                {stats.level < 5 ? "Novice Forager" : stats.level < 15 ? "Field Scout" : "Head Botanist"}
              </h1>
              <div className="mt-4 flex items-center gap-2 font-mono text-xs font-bold text-stone-400">
                <span className="text-amber-500">LVL {stats.level}</span>
                <div className="w-32 h-2 bg-stone-800 rounded-full overflow-hidden border border-stone-700">
                  <div className="h-full bg-amber-600 shadow-[0_0_10px_#d97706]" style={{ width: `${progressPercent}%` }}></div>
                </div>
                <span>{Math.floor(stats.xp)} XP</span>
              </div>
            </div>
            <Trophy size={40} className="text-stone-800 group-hover:text-amber-500 transition-colors duration-500"/>
          </div>
        </div>

        <div className="w-full md:w-1/3 bg-[#1c1917] border border-stone-800 p-6 rounded-lg flex flex-col justify-center items-center text-center">
           <Flame size={32} className={currentStreak > 0 ? "text-amber-500 animate-pulse drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" : "text-stone-700"} />
           <div className="text-5xl font-black font-serif mt-2 text-white">{currentStreak}</div>
           <div className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mt-1">Day Streak</div>
        </div>
      </div>

      {/* --- SECTION: THE ALMANAC (Charts) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12 relative z-10">
        
        {/* 1. RAINFALL FORECAST */}
        <div className="bg-[#1c1917] border border-stone-800 p-6 rounded-lg relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#0f0e0e] px-4">
             <span className="font-serif font-bold text-lg text-stone-400 border border-stone-800 px-3 py-1 rounded bg-[#1c1917]">Forecast</span>
          </div>
          
          <div className="mt-6 flex items-end justify-between h-40 gap-2 px-2">
            {forecast.map((count, i) => {
              const height = Math.min(count * 10 + 5, 100); 
              const day = daysOfWeek[(todayIndex + i) % 7];
              return (
                <div key={i} className="flex flex-col items-center gap-2 flex-1 group">
                   <div className="w-full relative flex items-end justify-center">
                     <motion.div 
                       initial={{ height: 0 }}
                       animate={{ height: `${height}%` }}
                       className={`w-full rounded-t-sm relative transition-all group-hover:-translate-y-1
                         ${count > 10 ? 'bg-red-900 border-t border-red-500 shadow-[0_0_15px_rgba(220,38,38,0.4)]' : 'bg-stone-800 border-t border-stone-600'}
                       `}
                     >
                        {count > 0 && <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-black text-white">{count}</div>}
                     </motion.div>
                   </div>
                   <span className={`text-xs font-mono font-bold ${i === 0 ? 'text-amber-500' : 'text-stone-600'}`}>{day}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* 2. THE HEAD BOTANIST (AI Interface) */}
        <div className="bg-[#1c1917] border border-stone-800 p-6 rounded-lg flex flex-col relative border-dashed">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#0f0e0e] px-4">
             <span className="font-serif font-bold text-lg text-stone-400 flex items-center gap-2">
               <Sparkles size={16} className="text-amber-500"/> Field AI
             </span>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center text-center mt-4">
            {!aiReport && !aiLoading && (
              <>
                <p className="font-serif text-stone-500 italic mb-6">"Data requires interpretation. Shall I analyze the logs?"</p>
                <button 
                  onClick={() => {
                    if (!isProOrAdmin) {
                      alert('🔒 Field AI is a Pro feature.');
                      return;
                    }
                    handleConsultBotanist();
                  }}

                  className={`px-6 py-2 font-mono text-xs font-bold uppercase tracking-widest transition-colors shadow-[0_0_15px_rgba(255,255,255,0.1)]
                    ${isProOrAdmin 
                      ? 'bg-stone-100 text-stone-900 hover:bg-amber-400 hover:text-black cursor-pointer'
                      : 'bg-stone-700 text-stone-400 cursor-not-allowed opacity-60'
                    }
                  `}


                >
                  Run Analysis
                </button>
              </>
            )}

            {aiLoading && (
              <div className="flex flex-col items-center gap-3">
                 <div className="w-8 h-8 border-4 border-stone-800 border-t-amber-500 rounded-full animate-spin"></div>
                 <span className="text-xs font-mono font-bold text-stone-500 uppercase tracking-widest">Decrypting Logs...</span>
              </div>
            )}

            {aiReport && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-left w-full bg-[#0f0e0e] p-4 border border-stone-800 rounded shadow-inner font-mono text-xs text-amber-500 leading-relaxed relative">
                 <div className="absolute -left-1 top-4 w-1 h-8 bg-amber-600"></div>
                 <p className="typewriter">{aiReport}</p>
                 <div className="mt-4 text-[9px] font-bold text-stone-600 uppercase text-right tracking-widest">/// END TRANSMISSION</div>
              </motion.div>
            )}
          </div>
        </div>

      </div>

      {/* --- SECTION: THE SPECIMEN WALL (Badges) --- */}
      <div className="relative z-10">
        <h3 className="text-2xl font-black font-serif text-white mb-8 flex items-center gap-3 border-b border-stone-800 pb-4">
          <BookOpen size={28} className="text-stone-600"/> Stamp Collection
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {badges.map((badge) => {
            const isUnlocked = badge.req;
            
            // LOCKED STATE (Dark Silhouette)
            if (!isUnlocked) {
              return (
                <div key={badge.id} className="aspect-square bg-[#151414] border border-stone-900 rounded-lg flex flex-col items-center justify-center p-2 opacity-40 relative overflow-hidden">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/graphy.png')] opacity-10"></div>
                  <Lock size={16} className="text-stone-700 mb-2"/>
                  <div className="text-[9px] font-bold text-stone-700 uppercase tracking-widest text-center">Locked</div>
                </div>
              );
            }

            // UNLOCKED STATE (Bright Paper Stamp on Dark Background)
            return (
              <div 
                key={badge.id} 
                onClick={() => triggerConfetti(badge)}
                className="group aspect-square bg-[#E7E5E4] rounded-sm p-1 flex flex-col items-center justify-center text-center relative cursor-pointer hover:scale-105 transition-transform shadow-[0_0_20px_rgba(0,0,0,0.5)] rotate-1 hover:rotate-0"
              >
                {/* Simulated Tape/Paper effect */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-4 bg-stone-300/30 rotate-2 backdrop-blur-sm"></div>

                <div className="w-full h-full border-2 border-stone-400 border-dashed p-2 flex flex-col items-center justify-center">
                  <div className={`mb-2 transform group-hover:scale-110 transition-transform duration-300
                    ${badge.tier === 'gold' ? 'text-amber-600' : 
                      badge.tier === 'platinum' ? 'text-indigo-600' : 
                      badge.tier === 'silver' ? 'text-slate-600' :
                      'text-amber-800'}
                  `}>
                    <badge.icon size={32} strokeWidth={2.5} />
                  </div>
                  
                  <div className="relative z-10">
                    <div className="text-[9px] font-black text-stone-900 uppercase tracking-tight leading-none">{badge.name}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}