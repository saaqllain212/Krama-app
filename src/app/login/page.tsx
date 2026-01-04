'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Sprout, ArrowRight, Lock, 
  User, Wind, Droplets, Leaf, Activity
} from 'lucide-react';

// --- THE DAILY SLAP (Garden Themed Aggression) ---
// Mixing the "War" intensity with "Garden" metaphors
const HARSH_TRUTHS = [
  { text: "The weeds grew while you slept.", sub: "Prune them now." },
  { text: "Comfort is fertilizer for failure.", sub: "Get to work." },
  { text: "Your memory is leaking. Plug the hole.", sub: "Review now." },
  { text: "A garden without a gardener is a graveyard.", sub: "Don't let it die." },
  { text: "Entropy does not take days off.", sub: "Neither should you." },
  { text: "You claimed you wanted this. Prove it.", sub: "Log in." }
];

export default function GardenLogin() {
  const supabase = createClient();
  const router = useRouter();
  
  // --- STATE ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Dynamic Content State
  const [truth, setTruth] = useState(HARSH_TRUTHS[0]);
  const [activeUsers, setActiveUsers] = useState(342); // Starting fake number

  // --- EFFECT: Random Quote & "Live" Counter ---
  useEffect(() => {
    // 1. Pick a random harsh truth on mount
    setTruth(HARSH_TRUTHS[Math.floor(Math.random() * HARSH_TRUTHS.length)]);

    // 2. The Fake Live Number Logic (Simulates activity)
    const interval = setInterval(() => {
      // Randomly add or remove 1-3 users to make it look "alive"
      setActiveUsers(prev => prev + Math.floor(Math.random() * 5) - 2);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  // --- ACTIONS ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/dashboard');
    }
  };

 const handleGoogleLogin = async () => {
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
    },
  });
};


  return (
    <div className="min-h-screen bg-[#020402] text-stone-300 font-sans flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* ===========================================
          BACKGROUND: THE WITHERING GARDEN
         =========================================== */}
      
      {/* 1. The Dead Forest Image (Same as Signup) */}
      <motion.div 
        // Subtle "Breathing" animation
        animate={{ scale: [1, 1.02, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1518182170546-07fb6cebc5ec?q=80&w=2500&auto=format&fit=crop')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          // Dark Emerald Filter
          filter: 'grayscale(100%) contrast(120%) brightness(40%) sepia(20%) hue-rotate(90deg)' 
        }}
      />

      {/* 2. Heavy Overlay (Readability) */}
      <div className="absolute inset-0 bg-[#020502]/85" />
      
      {/* 3. Fog Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-[#010201] to-transparent opacity-90" />

      
      {/* ===========================================
          THE MAIN LOGIN CARD
         =========================================== */}
      <div className="max-w-5xl w-full grid md:grid-cols-2 gap-0 bg-[#0a0c0a]/60 backdrop-blur-md border border-emerald-900/30 rounded-sm overflow-hidden shadow-[0_0_80px_rgba(6,78,59,0.15)] relative z-10">
        
        {/* ===========================================
            LEFT PANEL: THE MOTIVATION (Daily Slap)
            =========================================== */}
        <div className="hidden md:flex flex-col justify-between p-12 bg-black/40 relative border-r border-emerald-900/20">
           
           {/* TOP: The Fake Live Ticker */}
           <div className="flex items-center gap-3">
             <span className="relative flex h-3 w-3">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
               <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-600"></span>
             </span>
             <div className="text-xs font-bold uppercase tracking-widest text-emerald-500 flex items-center gap-2">
               Garden State <span className="text-stone-600">|</span> <span className="text-stone-200">{activeUsers.toLocaleString()} Active Keepers</span>
             </div>
           </div>

           {/* MIDDLE: The Harsh Truth (The Slap) */}
           <div className="relative z-10">
             <div className="absolute -left-6 -top-6 opacity-5 text-emerald-500 rotate-12">
                <Leaf size={140} />
             </div>
             <h1 className="text-3xl lg:text-4xl font-bold text-stone-100 leading-tight mb-6 font-serif italic">
               "{truth.text}"
             </h1>
             <p className="text-emerald-600 text-xs font-bold uppercase tracking-[0.2em] flex items-center gap-2">
               <Wind size={14} /> {truth.sub}
             </p>
           </div>

           {/* BOTTOM: Decay Meter */}
           <div className="space-y-2">
             <div className="flex justify-between text-[10px] uppercase tracking-widest text-stone-500">
               <span>Your Memory Integrity</span>
               <span className="text-red-500 animate-pulse">Critical</span>
             </div>
             {/* A bar that looks like it's rotting/draining */}
             <div className="h-1 w-full bg-stone-900 overflow-hidden relative">
               <motion.div 
                 initial={{ width: "100%" }}
                 animate={{ width: "35%" }} // Animates draining
                 transition={{ duration: 1.5, delay: 0.5 }}
                 className="absolute inset-0 bg-gradient-to-r from-emerald-900 via-emerald-700 to-red-900 h-full" 
               />
             </div>
             <p className="text-[9px] text-stone-600 font-mono">
               *Session required to halt decay.
             </p>
           </div>
        </div>

        {/* ===========================================
            RIGHT PANEL: THE LOGIN FORM
            =========================================== */}
        <div className="p-10 md:p-14 flex flex-col justify-center bg-[#050705]">
          
          <div className="mb-10">
            <div className="w-10 h-10 bg-emerald-900/20 rounded-full flex items-center justify-center mb-4 border border-emerald-500/20">
              <Sprout className="w-5 h-5 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-stone-100 font-serif">Enter the Garden.</h2>
            <p className="text-stone-500 text-xs mt-1">
              Resume maintenance of your knowledge graph.
            </p>
          </div>

          {error && (
            <div className="mb-6 bg-red-950/20 border-l-2 border-red-800 p-3 text-red-400 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest text-stone-500 font-bold">Keeper ID</label>
              <div className="relative group">
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#0a0c0a] border border-stone-800 text-stone-200 px-4 py-3 pl-10 text-sm focus:outline-none focus:border-emerald-800 focus:bg-[#0f120f] transition-all rounded-sm placeholder-stone-700"
                  placeholder="name@krama.os"
                />
                <User size={16} className="absolute left-3 top-3.5 text-stone-600 group-focus-within:text-emerald-700 transition-colors" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-[10px] uppercase tracking-widest text-stone-500 font-bold">Secret</label>
                <a href="/forgot-password" className="text-[10px] text-stone-600 hover:text-emerald-500 transition-colors">
                  Lost Key?
                </a>
              </div>
              <div className="relative group">
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#0a0c0a] border border-stone-800 text-stone-200 px-4 py-3 pl-10 text-sm focus:outline-none focus:border-emerald-800 focus:bg-[#0f120f] transition-all rounded-sm placeholder-stone-700"
                  placeholder="••••••••"
                />
                <Lock size={16} className="absolute left-3 top-3.5 text-stone-600 group-focus-within:text-emerald-700 transition-colors" />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-4 bg-emerald-900 hover:bg-emerald-800 text-emerald-100 font-bold uppercase tracking-[0.2em] text-xs transition-all flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(6,78,59,0.2)] hover:shadow-[0_0_40px_rgba(6,78,59,0.4)] disabled:opacity-50"
            >
              {loading ? "Opening Gate..." : "WATER THE MEMORY"} <Droplets size={14} />
            </button>
          </form>

          <div className="relative flex py-8 items-center opacity-40">
            <div className="flex-grow border-t border-stone-800"></div>
            <span className="flex-shrink-0 mx-4 text-[9px] text-stone-500 uppercase tracking-widest">OR</span>
            <div className="flex-grow border-t border-stone-800"></div>
          </div>

          <button 
            onClick={handleGoogleLogin}
            className="w-full py-3 bg-transparent border border-stone-800 text-stone-500 hover:text-stone-300 hover:border-stone-600 transition-all text-[10px] uppercase tracking-widest font-bold flex items-center justify-center gap-2"
          >
             Continue with Google
          </button>

          <p className="mt-8 text-center text-[10px] text-stone-600">
            Garden withering? <a href="/signup" className="text-emerald-700 hover:text-emerald-500 underline decoration-emerald-900/30 underline-offset-4">Replant seeds.</a>
          </p>
          <p className="mt-2 text-center text-[10px] text-stone-500">
            <a href="/" className="hover:text-emerald-500 underline">
              ← Back to landing
            </a>
          </p>


        </div>
      </div>
    </div>
  );
}