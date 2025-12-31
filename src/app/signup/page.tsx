'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Flame, Check, Lock, User, Mail, 
  ArrowRight, AlertTriangle 
} from 'lucide-react';

export default function GateOfThornsSignup() {
  const supabase = createClient();
  const router = useRouter();
  
  // --- STATE ---
  const [step, setStep] = useState<'filter' | 'form' | 'success'>('filter');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [checks, setChecks] = useState({ 1: false, 2: false, 3: false });
  const allChecked = checks[1] && checks[2] && checks[3];
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- ACTIONS ---
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!allChecked) return;

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setStep('success');
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  return (
    <div className="min-h-screen font-sans flex items-center justify-center p-4 relative overflow-hidden bg-black">
      
      {/* ===========================================
          THE "STRANGER THINGS" BACKGROUND
         =========================================== */}
      
      {/* 1. Solid Black Base */}
      <div className="absolute inset-0 bg-black" />

      {/* 2. The Glowing Red Cracks Texture */}
      <motion.div 
        // Subtle pulsing animation to make the cracks feel alive/hot
        animate={{ opacity: [0.6, 0.8, 0.6] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 pointer-events-none mix-blend-screen"
        style={{
          // Using a texture that looks like glowing red veins/cracks on black
          backgroundImage: `url('https://images.unsplash.com/photo-1603582679035-6676322d0931?q=80&w=2670&auto=format&fit=crop')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          // High contrast filter to make the red pop against pure black
          filter: 'contrast(150%) brightness(120%) saturate(150%)' 
        }}
      />

      {/* 3. Vignette & Red Glow from bottom */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)]" />
      <div className="absolute inset-0 bg-gradient-to-t from-red-950/50 via-transparent to-transparent" />


      <AnimatePresence mode="wait">
        
        {/* ===========================================
            PHASE 1: THE FILTER
           =========================================== */}
        {step === 'filter' && (
          <motion.div 
            key="filter"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
            // Made background slightly darker/redder for contrast against the cracks
            className="max-w-lg w-full bg-[#0f0101]/90 backdrop-blur-md border border-red-900/50 p-10 shadow-[0_0_50px_rgba(220,38,38,0.2)] relative z-10"
          >
            <h1 className="text-4xl text-red-600 font-bold mb-6 tracking-tighter uppercase font-serif">
              Turn Back.
            </h1>
            
            <div className="space-y-6 text-base leading-relaxed text-stone-300 mb-10 border-l-4 border-red-800 pl-6">
              <p>
                You are here because you feel a sudden burst of motivation. 
                <span className="text-red-100 font-bold"> That feeling is a lie.</span>
              </p>
              {/* Updated copy to match the "breaking/cracks" theme */}
              <p>
                Your current knowledge is fractured. You are at your breaking point. 
                Krama is not here to comfort you. We are here to apply pressure until the weak parts shatter.
              </p>
              <p className="text-red-500 font-semibold">
                95% of users cannot handle the strain and quit within 7 days.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <button 
                onClick={() => window.location.href = "https://www.netflix.com"}
                className="w-full py-5 bg-red-800 hover:bg-red-700 text-white font-bold tracking-widest text-sm transition-all shadow-lg flex items-center justify-center gap-2 uppercase"
              >
                You are right. Take me to Netflix. <ArrowRight size={18} />
              </button>
              
              <button 
                onClick={() => setStep('form')}
                className="w-full py-3 text-stone-500 hover:text-red-400 text-xs uppercase tracking-widest transition-colors mt-2 font-medium"
              >
                I accept the pressure. Proceed.
              </button>
            </div>
          </motion.div>
        )}

        {/* ===========================================
            PHASE 2: THE FORM
           =========================================== */}
        {step === 'form' && (
          <motion.div 
            key="form"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md w-full bg-[#0a0101] p-8 border-t-4 border-red-700 shadow-[0_0_100px_rgba(127,29,29,0.3)] relative z-10"
          >
             <h2 className="text-2xl text-red-100 mb-2 font-bold font-serif">Confirm Negligence.</h2>
             <p className="text-sm text-stone-500 mb-8">Unlock the form by accepting your reality.</p>

             {error && (
              <div className="mb-6 bg-red-950/50 border border-red-800/50 p-4 flex items-start gap-3 text-red-300 text-sm rounded">
                <AlertTriangle size={18} className="mt-0.5 shrink-0" /> 
                <span>{error}</span>
              </div>
            )}
            
            {/* REALITY CHECKS */}
            <div className="space-y-4 mb-8 bg-black/60 p-6 rounded border border-red-900/30">
              {[
                { id: 1, text: "I admit I have wasted time I will never get back." },
                { id: 2, text: "I accept that my foundation is cracked." },
                { id: 3, text: "I understand failure is my fault, not the tool's." }
              ].map((item) => (
                <label key={item.id} className="flex gap-4 cursor-pointer group items-start">
                  <div className={`mt-0.5 w-6 h-6 border flex items-center justify-center transition-all shrink-0 ${checks[item.id as 1|2|3] ? 'bg-red-800 border-red-800' : 'border-stone-800 group-hover:border-red-600'}`}>
                    <input 
                      type="checkbox" 
                      className="hidden" 
                      onChange={() => setChecks(p => ({...p, [item.id]: !p[item.id as 1|2|3]}))}
                    />
                    {checks[item.id as 1|2|3] && <Check size={16} className="text-white" />}
                  </div>
                  <span className={`text-sm font-medium leading-tight transition-colors ${checks[item.id as 1|2|3] ? 'text-stone-200' : 'text-stone-600'}`}>
                    {item.text}
                  </span>
                </label>
              ))}
            </div>

            {/* FORM */}
            <form onSubmit={handleSignup} className={`space-y-6 transition-all duration-500 ${allChecked ? 'opacity-100 grayscale-0' : 'opacity-40 grayscale pointer-events-none'}`}>
              
              {[
                { label: 'Identity', val: fullName, set: setFullName, type: 'text', ph: 'Who is failing?', icon: User },
                { label: 'Correspondence', val: email, set: setEmail, type: 'email', ph: 'Where do we send warnings?', icon: Mail },
                { label: 'Lock', val: password, set: setPassword, type: 'password', ph: '••••••••', icon: Lock },
              ].map((field, i) => (
                <div key={i}>
                  <label className="block text-xs uppercase text-stone-500 mb-2 tracking-widest font-bold">{field.label}</label>
                  <div className="relative group">
                    <input 
                      type={field.type} 
                      required
                      value={field.val}
                      onChange={(e) => field.set(e.target.value)}
                      className="w-full bg-[#050000] border border-stone-900 p-4 pl-12 text-stone-200 placeholder-stone-800 focus:border-red-800 outline-none transition-colors text-base rounded-sm" 
                      placeholder={field.ph} 
                    />
                    <field.icon size={18} className="absolute left-4 top-4 text-stone-700 group-focus-within:text-red-600 transition-colors" />
                  </div>
                </div>
              ))}

              <button 
                disabled={loading || !allChecked}
                className="w-full bg-red-900 text-stone-100 py-5 font-bold tracking-[0.2em] text-sm hover:bg-red-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed uppercase shadow-lg shadow-red-900/20"
              >
                {loading ? <span className="animate-pulse">Shattering Seals...</span> : "BEGIN THE GRIND"}
              </button>

              <button 
                type="button"
                onClick={handleGoogleSignup}
                disabled={loading}
                className="w-full py-4 bg-transparent border border-stone-900 text-stone-600 hover:text-stone-300 hover:border-stone-700 transition-all text-xs uppercase tracking-widest font-bold"
              >
                Sign In with Google
              </button>
            </form>
          </motion.div>
        )}

        {/* ===========================================
            PHASE 3: SUCCESS
           =========================================== */}
        {step === 'success' && (
          <motion.div 
             key="success"
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             className="max-w-md w-full text-center p-10 bg-[#0a0101] border border-red-900/30 relative z-10 shadow-[0_0_60px_rgba(127,29,29,0.2)]"
          >
             <div className="w-20 h-20 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-8 border border-red-500/30">
               <Flame className="w-10 h-10 text-red-600" />
             </div>
             <h2 className="text-3xl font-bold text-stone-200 uppercase tracking-widest mb-4 font-serif">Fate Sealed.</h2>
             <p className="text-stone-500 mb-8 text-base leading-relaxed">
               We have sent a verification link to your correspondence address.<br/>
               <span className="text-red-700 font-bold">If you do not verify within 1 hour, we assume you quit.</span>
             </p>
             <button 
                onClick={() => router.push('/login')}
                className="px-10 py-4 bg-stone-900 hover:bg-stone-800 text-white uppercase tracking-widest text-xs font-bold border border-stone-800"
             >
               Return to Login
             </button>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}