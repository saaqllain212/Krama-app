'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Droplets, Eye, Moon, ArrowLeft, Flame, Sparkles, 
  Volume2, VolumeX, Lock, Star, RefreshCcw, Map 
} from 'lucide-react';

// --- CONFIGURATION: ASSET PATHS ---
// These must match your public/greenhouse/ folder exactly.
const ASSETS = {
  sanctuary: { 
    bg: '/greenhouse/sanctuary.jpg', 
    video: '/greenhouse/rain.mp4', 
    audio: '/greenhouse/rain.mp3',
    fireVideo: '/greenhouse/fire.mp4' 
  },
  oracle: { 
    bg: '/greenhouse/oracle.jpg',    
    video: '/greenhouse/particles.mp4', 
    audio: '/greenhouse/cave.mp3' 
  },
  lantern: { 
    bg: '/greenhouse/lantern-bg.jpg', 
    lanternImg: '/greenhouse/single-lantern.jpg', 
    audio: '/greenhouse/wind.mp3' 
  }
};

const ORACLE_WISDOMS = [
  "The obstacle is the way.",
  "Do not confuse motion with action.",
  "We suffer more in imagination than in reality.",
  "Rest is also a weapon.",
  "Nature does not hurry, yet everything is accomplished.",
  "What you seek is seeking you.",
  "Consistency outperforms intensity.",
  "A river cuts through rock not because of its power, but its persistence."
];

// --- HELPER: AUDIO HOOK ---
// Handles playing sounds safely without crashing the browser.
const useRoomAudio = (src: string) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    // Create audio object
    const audio = new Audio(src);
    audio.loop = true;
    audio.volume = 0.5;
    audioRef.current = audio;

    // Debugging: Warn if file is missing
    audio.addEventListener('error', (e) => console.error("Audio Load Error:", src, e));

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, [src]);

  const toggle = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      // Browser requires interaction first
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.log("Audio Playback Blocked (User must interact first):", error);
        });
      }
    }
    setIsPlaying(!isPlaying);
  };

  return { isPlaying, toggle };
};

// --- ROOM 1: SANCTUARY (The Cabin) ---
const SanctuaryRoom = ({ onExit }: { onExit: () => void }) => {
  const [worryText, setWorryText] = useState("");
  const [isBurning, setIsBurning] = useState(false);
  const { isPlaying, toggle } = useRoomAudio(ASSETS.sanctuary.audio);

  return (
    <div className="absolute inset-0 z-50 overflow-hidden bg-black">
      {/* 1. Background Image */}
      <img 
        src={ASSETS.sanctuary.bg} 
        className="absolute inset-0 w-full h-full object-cover opacity-60" 
        alt="Sanctuary" 
      />
      
      {/* 2. Rain Video Overlay (Looping) */}
      <div className="absolute inset-0 mix-blend-screen opacity-80 pointer-events-none">
         <video autoPlay loop muted playsInline className="w-full h-full object-cover">
            <source src={ASSETS.sanctuary.video} type="video/mp4" />
         </video>
      </div>

      {/* 3. Fire Video Overlay (Triggered by Action) */}
      <AnimatePresence>
        {isBurning && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="absolute inset-0 z-40 mix-blend-screen pointer-events-none flex items-end justify-center"
          >
             <video autoPlay muted playsInline className="w-full h-3/4 object-cover opacity-90">
                <source src={ASSETS.sanctuary.fireVideo} type="video/mp4" />
             </video>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* 4. Interactive UI Layer */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
         {/* Top Controls */}
         <div className="absolute top-6 left-6 flex gap-3">
            <button onClick={onExit} className="text-white/50 hover:text-white flex items-center gap-2 text-xs font-bold uppercase tracking-widest border border-white/20 px-4 py-2 rounded-full backdrop-blur-md transition-all">
              <ArrowLeft size={14}/> Exit
            </button>
            <button onClick={toggle} className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest border border-white/20 px-4 py-2 rounded-full backdrop-blur-md transition-all ${isPlaying ? 'bg-white text-black' : 'text-white/50 hover:text-white'}`}>
              {isPlaying ? <Volume2 size={14}/> : <VolumeX size={14}/>} Sound
            </button>
         </div>

         <AnimatePresence>
           {!isBurning ? (
             <motion.div 
               initial={{ opacity: 0, y: 20 }} 
               animate={{ opacity: 1, y: 0 }} 
               exit={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }} 
               className="bg-black/40 backdrop-blur-md p-8 rounded-xl border border-white/10 max-w-md w-full text-center shadow-2xl"
             >
               <Droplets className="mx-auto text-blue-300 mb-4" size={32} />
               <h3 className="text-white font-serif text-3xl mb-2">The Sanctuary</h3>
               <p className="text-blue-200/70 font-mono text-xs uppercase tracking-widest mb-8">
                 Rain washes away the noise.
               </p>
               
               <textarea 
                 className="w-full bg-black/50 text-white p-4 rounded-lg mb-4 placeholder:text-white/30 focus:outline-none resize-none border border-white/10 font-serif text-lg leading-relaxed"
                 rows={3}
                 placeholder="What stress are you holding? Type it here..."
                 value={worryText}
                 onChange={(e) => setWorryText(e.target.value)}
               />
               
               <button 
                 onClick={() => { 
                   setIsBurning(true); 
                   setTimeout(() => { setWorryText(""); setIsBurning(false); }, 4000); // 4s delay to watch fire video
                 }}
                 disabled={!worryText}
                 className="w-full py-3 bg-red-900/80 hover:bg-red-800 text-white font-bold uppercase tracking-widest text-xs transition-colors rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
               >
                 <Flame size={14} /> Burn This Thought
               </button>
             </motion.div>
           ) : (
             <motion.div 
               initial={{ opacity: 0, scale: 0.5 }} 
               animate={{ opacity: 1, scale: 1.2 }} 
               exit={{ opacity: 0, y: -50 }} 
               className="text-center z-50"
             >
                <h2 className="text-orange-100 font-serif text-5xl italic drop-shadow-[0_0_10px_rgba(0,0,0,0.8)]">Released.</h2>
             </motion.div>
           )}
         </AnimatePresence>
      </div>
    </div>
  );
};

// --- ROOM 2: ORACLE (The Cave) ---
const OracleRoom = ({ onExit }: { onExit: () => void }) => {
  const [wisdom, setWisdom] = useState("");
  const { isPlaying, toggle } = useRoomAudio(ASSETS.oracle.audio);

  return (
    <div className="absolute inset-0 z-50 overflow-hidden bg-black">
      {/* 1. Background Image */}
      <img 
        src={ASSETS.oracle.bg} 
        className="absolute inset-0 w-full h-full object-cover opacity-50" 
        alt="Oracle" 
      />
      
      {/* 2. Particles Video Overlay */}
      <div className="absolute inset-0 mix-blend-screen opacity-60 pointer-events-none">
         <video autoPlay loop muted playsInline className="w-full h-full object-cover">
            <source src={ASSETS.oracle.video} type="video/mp4" />
         </video>
      </div>
      
      {/* 3. Interactive UI Layer */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
         {/* Top Controls */}
         <div className="absolute top-6 left-6 flex gap-3">
            <button onClick={onExit} className="text-white/50 hover:text-white flex items-center gap-2 text-xs font-bold uppercase tracking-widest border border-white/20 px-4 py-2 rounded-full backdrop-blur-md transition-all">
              <ArrowLeft size={14}/> Exit
            </button>
            <button onClick={toggle} className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest border border-white/20 px-4 py-2 rounded-full backdrop-blur-md transition-all ${isPlaying ? 'bg-white text-black' : 'text-white/50 hover:text-white'}`}>
              {isPlaying ? <Volume2 size={14}/> : <VolumeX size={14}/>} Sound
            </button>
         </div>

         <AnimatePresence mode='wait'>
           {!wisdom ? (
             <motion.button 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               onClick={() => setWisdom(ORACLE_WISDOMS[Math.floor(Math.random() * ORACLE_WISDOMS.length)])}
               whileHover={{ scale: 1.05 }}
               whileTap={{ scale: 0.95 }}
               className="group relative w-40 h-40 rounded-full border-2 border-purple-500/30 bg-purple-900/10 backdrop-blur-sm flex items-center justify-center shadow-[0_0_50px_rgba(168,85,247,0.2)] hover:shadow-[0_0_80px_rgba(168,85,247,0.5)] transition-all cursor-pointer"
             >
                <Eye size={48} className="text-purple-200/70 group-hover:text-white transition-colors" />
                <span className="absolute -bottom-10 text-purple-200/50 text-[10px] font-mono uppercase tracking-widest group-hover:text-purple-200">Consult The Oracle</span>
             </motion.button>
           ) : (
             <motion.div 
               initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} 
               className="max-w-2xl text-center px-8"
             >
                <div className="mb-6 text-purple-300 uppercase tracking-[0.3em] text-[10px] font-bold opacity-70">Ancient Wisdom</div>
                <h3 className="text-3xl md:text-5xl font-serif text-white leading-tight italic drop-shadow-2xl">"{wisdom}"</h3>
                <button 
                  onClick={() => setWisdom("")} 
                  className="mt-12 text-white/30 hover:text-white text-xs uppercase tracking-widest border-b border-transparent hover:border-white transition-all pb-1"
                >
                  Close Eyes (Reset)
                </button>
             </motion.div>
           )}
         </AnimatePresence>
      </div>
    </div>
  );
};

// --- ROOM 3: LANTERN (The Summit) ---
const LanternRoom = ({ onExit }: { onExit: () => void }) => {
  const [released, setReleased] = useState(false);
  const { isPlaying, toggle } = useRoomAudio(ASSETS.lantern.audio);

  return (
    <div className="absolute inset-0 z-50 overflow-hidden bg-black">
      {/* 1. Background Image */}
      <img 
        src={ASSETS.lantern.bg} 
        className="absolute inset-0 w-full h-full object-cover opacity-80" 
        alt="Summit" 
      />
      
      {/* 2. Floating Lanterns Animation (CSS Parallax) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
         {[...Array(15)].map((_, i) => (
            <motion.img 
               key={`bg-${i}`}
               src={ASSETS.lantern.lanternImg}
               initial={{ y: "110vh", x: Math.random() * 100 + "%", opacity: 0, scale: 0.1 }}
               animate={{ y: "-20vh", opacity: [0, 0.5, 0], rotate: Math.random() * 10 - 5 }}
               transition={{ 
                 duration: 15 + Math.random() * 20, 
                 repeat: Infinity, 
                 delay: Math.random() * 10, 
                 ease: "linear" 
               }}
               className="absolute mix-blend-screen opacity-50 blur-[1px]"
               style={{ width: '50px' }}
            />
         ))}
      </div>
      
      {/* 3. Interactive UI Layer */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
         {/* Top Controls */}
         <div className="absolute top-6 left-6 flex gap-3">
            <button onClick={onExit} className="text-white/50 hover:text-white flex items-center gap-2 text-xs font-bold uppercase tracking-widest border border-white/20 px-4 py-2 rounded-full backdrop-blur-md transition-all">
              <ArrowLeft size={14}/> Exit
            </button>
            <button onClick={toggle} className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest border border-white/20 px-4 py-2 rounded-full backdrop-blur-md transition-all ${isPlaying ? 'bg-white text-black' : 'text-white/50 hover:text-white'}`}>
              {isPlaying ? <Volume2 size={14}/> : <VolumeX size={14}/>} Sound
            </button>
         </div>

         {!released ? (
           <div className="text-center group cursor-pointer" onClick={() => setReleased(true)}>
              <motion.div animate={{ y: [0, -15, 0] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }} className="relative">
                 <img src={ASSETS.lantern.lanternImg} className="w-48 mix-blend-screen drop-shadow-[0_0_30px_rgba(255,100,0,0.5)]" alt="Lantern" />
                 <div className="absolute inset-0 flex items-center justify-center">
                   <Sparkles className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" size={32} />
                 </div>
              </motion.div>
              <p className="mt-8 text-orange-200/60 font-mono text-xs uppercase tracking-widest group-hover:text-orange-100 transition-colors">
                Click to Release Light
              </p>
           </div>
         ) : (
           <>
              <motion.img 
                src={ASSETS.lantern.lanternImg} 
                initial={{ y: 0, scale: 1, opacity: 1 }} 
                animate={{ y: -600, scale: 0.2, opacity: 0 }} 
                transition={{ duration: 5, ease: "easeIn" }} 
                className="w-48 mix-blend-screen fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30" 
              />
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }} className="text-center">
                 <h2 className="text-6xl font-serif text-white/90 italic mb-2">Ascension.</h2>
                 <p className="text-orange-200/50 font-mono text-xs uppercase tracking-widest">Your light joins the stars.</p>
                 <button 
                   onClick={() => setReleased(false)} 
                   className="mt-8 text-white/30 hover:text-white text-[10px] uppercase tracking-widest border-b border-transparent hover:border-white"
                 >
                   Light Another
                 </button>
              </motion.div>
           </>
         )}
      </div>
    </div>
  );
};

// --- HELPER COMPONENT: NODE BUTTON ---
const NodeButton = ({ label, icon: Icon, color, isLocked, onClick }: any) => {
  const colors: any = {
    blue: "border-blue-400 text-blue-200 shadow-blue-500/50 bg-blue-900/40",
    purple: "border-purple-400 text-purple-200 shadow-purple-500/50 bg-purple-900/40",
    orange: "border-orange-400 text-orange-200 shadow-orange-500/50 bg-orange-900/40"
  };

  return (
    <motion.button 
      onClick={!isLocked ? onClick : undefined} 
      whileHover={!isLocked ? { scale: 1.1 } : {}} 
      className={`flex flex-col items-center gap-2 group/node ${isLocked ? 'opacity-50 grayscale cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <div className={`w-16 h-16 rounded-full border-2 backdrop-blur-md flex items-center justify-center shadow-[0_0_20px_rgba(0,0,0,0.5)] transition-all ${isLocked ? 'bg-black/60 border-stone-600 text-stone-500' : `bg-black/60 ${colors[color]}`}`}>
         {isLocked ? <Lock size={20} /> : <Icon size={24} />}
      </div>
      <span className={`text-[10px] font-mono font-bold uppercase tracking-widest bg-black/80 px-2 py-1 rounded whitespace-nowrap ${isLocked ? 'text-stone-500' : 'text-white'}`}>
        {label}
        {isLocked && (
          <span className="block text-[9px] text-stone-400 normal-case tracking-normal">
            Progress required
          </span>
        )}
      </span>

    </motion.button>
  );
}

// --- MAIN COMPONENT: GREENHOUSE MAP ---
interface GreenhouseProps {
  currentProgress?: number; // Prop passed from Dashboard
}

export default function Greenhouse({ currentProgress = 0 }: GreenhouseProps) {
  const [activeRoom, setActiveRoom] = useState<'SANCTUARY' | 'ORACLE' | 'LANTERN' | null>(null);
  
  // Loading state to prevent hydration mismatch
  const [isClient, setIsClient] = useState(false);
  
  // 1. First Time Demo Mode State
  const [isDemoMode, setIsDemoMode] = useState(false);
  
  // 2. Target State
  const [target, setTarget] = useState<number>(0);

  // 3. Initialize on Client Side
  useEffect(() => {
    setIsClient(true);
    
    // Recover Target from Storage
    const savedTarget = localStorage.getItem('krama_greenhouse_target');
    if (savedTarget) setTarget(parseInt(savedTarget));

    // CHECK FOR FIRST VISIT
    const hasVisited = localStorage.getItem('krama_greenhouse_visited');
    if (!hasVisited) {
       setIsDemoMode(true); // Enable Welcome Mode for new users
    }
  }, []);

  // Save Target changes
  useEffect(() => {
    if (isClient) localStorage.setItem('krama_greenhouse_target', target.toString());
  }, [target, isClient]);

  // Actions
  const closeDemo = () => {
    setIsDemoMode(false);
    localStorage.setItem('krama_greenhouse_visited', 'true'); // Mark as visited
    setTarget(0); // Force them to set a real target now
  };

  const resetTarget = () => {
    setTarget(0);
    localStorage.setItem('krama_greenhouse_target', '0');
  };

  // DEVELOPER RESET BUTTON (Clear history to test Welcome Screen again)
  const devReset = () => {
    localStorage.removeItem('krama_greenhouse_visited');
    localStorage.removeItem('krama_greenhouse_target');
    window.location.reload();
  };

  // Prevent flash of content during loading
  if (!isClient) return <div className="w-full h-[700px] bg-stone-900 border-4 border-stone-900 flex items-center justify-center text-white/50 font-mono">LOADING MAP...</div>;

  return (
    <div className="relative w-full h-[700px] bg-stone-900 rounded-sm overflow-hidden border-4 border-stone-900 shadow-2xl group select-none">
      
      {/* 1. BACKGROUND */}
      <div className="absolute inset-0 z-0">
         <img 
           src="/greenhouse/map-bg.jpg" 
           alt="Mountain Path" 
           className="w-full h-full object-cover object-[50%_35%] opacity-80" 
         />
         <div className="absolute inset-0 bg-black/40"></div>
      </div>

      {/* DEV RESET BUTTON (Hidden in corner for testing) */}
      <button 
        onClick={devReset} 
        className="absolute top-2 right-2 z-50 text-[9px] text-stone-600 hover:text-red-500 font-mono uppercase font-bold flex items-center gap-1 opacity-30 hover:opacity-100 transition-opacity bg-black/50 px-2 py-1 rounded"
      >
        <RefreshCcw size={10}/> DEV RESET
      </button>

      {/* 2. MAP UI LAYER (Visible when no room is active) */}
      {!activeRoom && (
        <div className="absolute inset-0 z-10">
          
          {/* A. WELCOME MODAL (Demo Mode - First Time) */}
          {isDemoMode && (
             <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-8">
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }} 
                  animate={{ scale: 1, opacity: 1 }} 
                  className="max-w-md text-center"
                >
                   <Star className="w-12 h-12 text-yellow-400 mx-auto mb-4 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
                   <h2 className="font-serif text-3xl font-black text-white mb-2">The Path is Open</h2>
                   <p className="text-stone-300 font-serif italic mb-6">
                     "Scholar, tonight the mountain welcomes you freely. Explore the sanctuary, consult the oracle, and reach the summit. Tomorrow, the climb begins."
                   </p>
                   <button 
                     onClick={closeDemo} 
                     className="px-8 py-3 bg-white text-stone-900 font-bold uppercase tracking-widest text-xs hover:bg-stone-200 transition-colors"
                   >
                     Begin Exploration
                   </button>
                </motion.div>
             </div>
          )}

          {/* B. TARGET SETTER (If NOT Demo & No Target) */}
          {!isDemoMode && target === 0 && (
             <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center">
                <div className="bg-white p-8 max-w-sm text-center shadow-[8px_8px_0_#444]">
                   <h2 className="font-serif text-2xl font-black text-stone-900 mb-4">Set Your Intention</h2>
                   <p className="text-xs text-stone-500 mb-6 uppercase tracking-widest">How many topics will you master today?</p>
                   <div className="flex gap-2 justify-center">
                      {[3, 5, 8].map(num => (
                        <button key={num} onClick={() => setTarget(num)} className="w-16 h-16 border-2 border-stone-900 hover:bg-stone-900 hover:text-white font-black text-xl transition-colors">{num}</button>
                      ))}
                   </div>
                </div>
             </div>
          )}

          {/* C. PROGRESS DISPLAY */}
          {(target > 0 || isDemoMode) && (
            <div className="absolute top-6 right-6 text-right z-40">
               {isDemoMode ? (
                 <div className="text-yellow-400 text-xs font-bold uppercase tracking-widest border border-yellow-400/50 px-3 py-1 bg-yellow-900/20">Free Roam Active</div>
               ) : (
                 <>
                   <div className="text-white text-4xl font-serif font-black drop-shadow-md">{currentProgress} <span className="text-white/50 text-xl">/ {target}</span></div>
                   <div className="text-[10px] text-white/50 uppercase tracking-widest font-bold">Daily Progress</div>
                   <button onClick={resetTarget} className="mt-2 text-[9px] text-red-400 hover:text-red-300 underline uppercase">Reset Target</button>
                 </>
               )}
            </div>
          )}

          {/* D. RESPONSIVE PATH LINE */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-50 drop-shadow-md" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M 30 85 Q 50 85 70 50 Q 80 30 50 15" fill="none" stroke="white" strokeWidth="0.5" strokeDasharray="1 1" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          </svg>

          {/* E. NODES & BUTTONS */}
          
          {/* Node 1: Sanctuary */}
          <div className="absolute" style={{ top: '85%', left: '30%', transform: 'translate(-50%, -50%)' }}>
             <NodeButton 
               label="Sanctuary" 
               icon={Droplets} 
               color="blue" 
               // UNLOCK LOGIC: Unlock if Demo Mode OR Progress >= 1
               isLocked={!isDemoMode && currentProgress < 1} 
               onClick={() => setActiveRoom('SANCTUARY')} 
             />
          </div>

          {/* Node 2: Oracle */}
          <div className="absolute" style={{ top: '50%', left: '70%', transform: 'translate(-50%, -50%)' }}>
             <NodeButton 
               label="The Oracle" 
               icon={Eye} 
               color="purple" 
               // UNLOCK LOGIC: Unlock if Demo Mode OR Progress >= 4
               isLocked={!isDemoMode && currentProgress < 4} 
               onClick={() => setActiveRoom('ORACLE')} 
             />
          </div>

          {/* Node 3: Summit */}
          <div className="absolute" style={{ top: '15%', left: '50%', transform: 'translate(-50%, -50%)' }}>
             <NodeButton 
               label="The Summit" 
               icon={Moon} 
               color="orange" 
               // UNLOCK LOGIC: Unlock if Demo Mode OR Progress >= 8
               isLocked={!isDemoMode && currentProgress < 8} 
               onClick={() => setActiveRoom('LANTERN')} 
             />
          </div>
        </div>
      )}

      {/* 3. ACTIVE ROOM LAYERS */}
      <AnimatePresence>
        {activeRoom === 'SANCTUARY' && <SanctuaryRoom key="sanctuary" onExit={() => setActiveRoom(null)} />}
        {activeRoom === 'ORACLE' && <OracleRoom key="oracle" onExit={() => setActiveRoom(null)} />}
        {activeRoom === 'LANTERN' && <LanternRoom key="lantern" onExit={() => setActiveRoom(null)} />}
      </AnimatePresence>

    </div>
  );
}