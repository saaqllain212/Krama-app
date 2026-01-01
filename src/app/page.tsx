'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { 
  Leaf, Droplet, Wind, Sprout, 
  ArrowRight, CheckCircle2, ChevronDown, 
  Smartphone, Apple, Users, ShieldAlert,
  HelpCircle, AlertTriangle, Flower, AlertCircle,
  XCircle, Anchor, Download, Calculator, Axe, Trees,
  MoveHorizontal
} from 'lucide-react';

export default function WitheringGarden() {
  const router = useRouter();
  
  // --- STATE ---
  const [isWatered, setIsWatered] = useState(false);
  const [userCount, setUserCount] = useState(142); 
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  
  // CALCULATOR STATE
  const [monthlySalary, setMonthlySalary] = useState<number | ''>(80000); 
  const [coachingFees, setCoachingFees] = useState<number | ''>(150000); 
  
  const salaryVal = monthlySalary === '' ? 0 : monthlySalary;
  const feesVal = coachingFees === '' ? 0 : coachingFees;
  const dropYearCost = (salaryVal * 12) + feesVal;

  // SLIDER STATE
  const [sliderPosition, setSliderPosition] = useState(50);
  const sliderRef = useRef<HTMLDivElement>(null);

  // --- SCROLL ANIMATIONS ---
  const { scrollY } = useScroll();
  const yHero = useTransform(scrollY, [0, 1000], [0, 200]);
  const opacityHero = useTransform(scrollY, [0, 800], [1, 0]);


  // --- HELPER: SCROLL TO SECTION (NEW) ---
  const scrollToDecay = () => {
    const element = document.getElementById('decay-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // --- HELPER: HANDLE SLIDER DRAG ---
  const handleDrag = (event: any) => {
    if (sliderRef.current) {
      const rect = sliderRef.current.getBoundingClientRect();
      const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
      const percentage = (x / rect.width) * 100;
      setSliderPosition(percentage);
    }
  };

  // --- COMPONENT: THE INTERACTIVE TREE ---
  const Tree = ({ watered }: { watered: boolean }) => (
    <div className="relative w-64 h-80 flex justify-center items-end select-none">
      <div className="w-6 h-32 bg-stone-700 rounded-sm relative z-10">
        <motion.div animate={{ rotate: watered ? -15 : 10 }} className="absolute bottom-20 left-0 w-20 h-3 bg-stone-600 origin-bottom-left rounded-full"/>
        <motion.div animate={{ rotate: watered ? 15 : -10 }} className="absolute bottom-24 right-0 w-16 h-3 bg-stone-600 origin-bottom-right rounded-full"/>
      </div>
      <AnimatePresence>
        <motion.div 
          className="absolute bottom-28 w-full flex justify-center"
          initial={false}
          animate={{ scale: watered ? 1.4 : 0.7, filter: watered ? 'grayscale(0%)' : 'grayscale(100%) brightness(0.9) sepia(0.8)' }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className={`relative w-40 h-40 rounded-full blur-md transition-colors duration-1000 ${watered ? 'bg-emerald-600/40' : 'bg-amber-800/30'}`}></div>
          <div className={`absolute top-2 w-32 h-32 rounded-full transition-colors duration-1000 ${watered ? 'bg-emerald-500' : 'bg-amber-900'}`}></div>
          <div className={`absolute top-6 left-2 w-20 h-20 rounded-full transition-colors duration-1000 ${watered ? 'bg-emerald-400' : 'bg-amber-800'}`}></div>
          <div className={`absolute top-4 right-4 w-24 h-24 rounded-full transition-colors duration-1000 ${watered ? 'bg-emerald-600' : 'bg-stone-700'}`}></div>
        </motion.div>
      </AnimatePresence>
      {!watered && (
        <>
          {[1,2,3].map((i) => (
            <motion.div 
              key={i}
              initial={{ y: 0, opacity: 1, x: 0 }}
              animate={{ y: 150, opacity: 0, rotate: 90 + (i*20), x: i % 2 === 0 ? 50 : -50 }}
              transition={{ duration: 3 + i, repeat: Infinity, ease: "linear", delay: i }}
              className={`absolute top-20 ${i % 2 === 0 ? 'left-10' : 'right-12'} text-amber-700`}
            >
              <Leaf size={14 + i} />
            </motion.div>
          ))}
        </>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-900 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* 1. NAVBAR */}
      <nav className="fixed top-0 w-full bg-[#FDFBF7]/90 backdrop-blur-md z-50 border-b border-stone-200 px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-emerald-950">
          <Sprout className="text-emerald-700" fill="currentColor" />
          KRAMA
        </div>
        <div className="flex gap-4">
          <button onClick={() => router.push('/login')} className="hidden md:block text-sm font-bold text-stone-600 hover:text-emerald-800 transition-colors">Log In</button>
          <button onClick={() => router.push('/signup')} className="bg-emerald-900 text-[#FDFBF7] px-6 py-2 rounded-full text-sm font-bold hover:bg-emerald-800 transition-all shadow-lg hover:shadow-emerald-900/20">
            Start Tending
          </button>
        </div>
      </nav>

      {/* 2. THE COMPETITOR TICKER */}
      <div className="fixed top-20 w-full bg-emerald-950 text-emerald-400 z-40 overflow-hidden py-2 border-b border-emerald-900">
        <motion.div 
          animate={{ x: [0, -1000] }}
          transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
          className="whitespace-nowrap flex gap-12 text-[10px] uppercase font-bold tracking-widest"
        >
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="flex gap-12">
              <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div> 42 Students reviewing 'Modern History' right now</span>
              <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div> 12,500 Recalls in last hour</span>
              <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div> Competition is awake. Are you?</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* 3. HERO SECTION */}
      <section className="pt-40 pb-20 px-6 flex flex-col items-center text-center max-w-5xl mx-auto min-h-screen relative">
        <motion.div style={{ y: yHero, opacity: opacityHero }} className="flex flex-col items-center">
          
          <div className="mb-6 cursor-pointer group relative" onMouseEnter={() => setIsWatered(true)} onMouseLeave={() => setIsWatered(false)} onClick={() => setIsWatered(!isWatered)}>
            <Tree watered={isWatered} />
            <div className="mt-4 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-stone-400 group-hover:text-emerald-600 transition-colors">
              {isWatered ? <span className="flex items-center gap-2 text-emerald-600"><Droplet size={14} fill="currentColor"/> Watering Memory</span> : <span className="flex items-center gap-2 text-amber-600"><Wind size={14}/> Decay in progress...</span>}
            </div>
          </div>

          <div className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-emerald-800/60 border-b border-emerald-800/10 pb-1">
            Spaced Repetition Engine • Syllabus Tracker
          </div>

          <h1 className="text-5xl md:text-8xl font-black text-emerald-950 mb-6 tracking-tight leading-[0.9]">
            Your knowledge is <br/> <span className="text-emerald-700 italic font-serif">a living thing.</span>
          </h1>
          
          <p className="text-lg md:text-2xl text-stone-500 max-w-2xl font-serif italic mb-10 leading-relaxed">
            "You forget 50% of what you study within 24 hours. Most tools help you hoard information. Krama helps you keep it alive."
          </p>

          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
            <button onClick={() => router.push('/signup')} className="bg-emerald-900 text-[#FDFBF7] px-8 py-4 rounded-full text-lg font-bold hover:bg-emerald-800 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 flex items-center justify-center gap-2">
              <Droplet size={20} fill="currentColor"/> Preserve Your Knowledge
            </button>
            <button onClick={scrollToDecay} className="px-8 py-4 rounded-full text-lg font-bold text-stone-400 hover:text-amber-700 transition-colors flex items-center justify-center gap-2">
              Watch it Decay <ArrowRight size={20}/>
            </button>
          </div>
        </motion.div>

        <motion.div animate={{ y: [0, 10, 0], opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }} className="absolute bottom-10">
          <ChevronDown className="text-stone-400" size={32} />
        </motion.div>
      </section>

      {/* 4. THE PROBLEM (Decay) - ADDED ID HERE */}
      <section id="decay-section" className="py-32 bg-stone-100 px-6 border-t border-stone-200">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-block bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
              <ShieldAlert size={14}/> The Leaking Bucket
            </div>
            <h2 className="text-4xl font-black text-stone-900 mb-6 leading-tight">The Cost of Neglect.</h2>
            <p className="text-lg text-stone-600 mb-6 leading-relaxed">
              You spent 40 hours studying Anatomy last month. Today, only 12 hours of that remains accessible. You didn't fail; you just neglected the maintenance.
            </p>
          </div>
          
          <div className="bg-white p-8 rounded-2xl shadow-xl relative overflow-hidden">
            <h3 className="text-xs font-bold text-stone-400 uppercase mb-8 tracking-widest">Memory Retention (30 Days)</h3>
            <div className="relative h-64 w-full border-b border-l border-stone-200">
              <svg className="absolute inset-0 h-full w-full overflow-visible">
                <path d="M0,20 C50,200 150,230 350,240" fill="none" stroke="#b45309" strokeWidth="4" strokeDasharray="10 5" />
                <circle cx="0" cy="20" r="6" fill="#064e3b" />
                <circle cx="350" cy="240" r="6" fill="#b45309" />
                <foreignObject x="60" y="80" width="140" height="60">
                  <div className="bg-amber-50 text-amber-800 text-xs p-3 rounded-lg border border-amber-200 shadow-sm font-bold">
                    <AlertCircle size={12} className="inline mr-1"/> -70% Lost in 7 Days
                  </div>
                </foreignObject>
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* 5. THE DROP YEAR CALCULATOR */}
      <section className="py-32 bg-[#FDFBF7] px-6 border-t border-stone-200">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 text-red-700 rounded-full text-[10px] font-bold uppercase tracking-widest mb-4">
              <Calculator size={12}/> The Cost of Failure
            </div>
            <h2 className="text-3xl font-black text-stone-900">Can you afford a Drop Year?</h2>
            <p className="text-stone-500 mt-2">The cost isn't just fees. It's lost opportunity.</p>
          </div>

          <div className="bg-white border border-stone-200 rounded-3xl p-8 shadow-xl grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div>
                <label className="text-xs font-bold text-stone-500 uppercase tracking-widest block mb-2">Expected Future Monthly Salary</label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-stone-400 font-serif text-lg">₹</span>
                  <input 
                    type="number" 
                    value={monthlySalary} 
                    onChange={(e) => setMonthlySalary(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl font-bold text-stone-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-stone-500 uppercase tracking-widest block mb-2">Current Coaching/Hostel Fees</label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-stone-400 font-serif text-lg">₹</span>
                  <input 
                    type="number" 
                    value={coachingFees} 
                    onChange={(e) => setCoachingFees(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl font-bold text-stone-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            <div className="bg-red-50 p-8 rounded-2xl text-center relative overflow-hidden border border-red-100">
              <Axe className="absolute -right-6 -bottom-6 w-32 h-32 text-red-100 rotate-12" />
              <div className="relative z-10">
                <p className="text-stone-500 text-xs font-bold uppercase tracking-widest mb-2">Total Loss (1 Year)</p>
                <div className="text-4xl font-black text-red-700 mb-2">
                  ₹{(dropYearCost / 100000).toFixed(2)} Lakhs
                </div>
                <p className="text-red-900/60 text-sm font-medium">
                  (12x Salary) + Fees
                </p>
                <div className="mt-6 pt-6 border-t border-red-200">
                  <p className="text-stone-600 font-serif italic text-sm">
                    "Don't let your growth reset to zero. <br/> Save the year."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. THE SYLLABUS FOREST */}
      <section className="py-24 bg-stone-900 px-6 text-stone-200 select-none">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-widest text-xs mb-4">
              <Trees size={16}/> The Enemy
            </div>
            <h2 className="text-4xl font-black text-white mb-6">The Jungle vs. The Garden.</h2>
            <p className="text-stone-400 text-lg leading-relaxed mb-8">
              The sheer volume of the syllabus is designed to break you. You cannot memorize a jungle. You must prune it.
              <br/><br/>
              Krama turns an ocean of noise into a single, manageable path.
            </p>
          </div>

          {/* SLIDER */}
          <div ref={sliderRef} className="relative h-80 rounded-2xl overflow-hidden border border-stone-700 shadow-2xl cursor-col-resize group" onMouseMove={handleDrag} onTouchMove={(e) => handleDrag(e.touches[0])}>
            <div className="absolute inset-0 z-0">
               <img src="https://images.unsplash.com/photo-1518495973542-4542c06a5843?q=80&w=1000" alt="Chaos" className="w-full h-full object-cover filter brightness-50 contrast-125" />
               <div className="absolute bottom-6 left-6 z-10">
                  <h3 className="text-red-500 font-black uppercase tracking-widest text-sm bg-black/60 px-2 py-1 inline-block backdrop-blur-sm rounded">Unmanaged</h3>
                  <p className="text-stone-300 text-xs mt-1 drop-shadow-md">Chaos. Overwhelm. Panic.</p>
               </div>
            </div>
            <div className="absolute inset-0 z-10 overflow-hidden" style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}>
               <img src="https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?q=80&w=1000" alt="Order" className="w-full h-full object-cover filter contrast-110 brightness-110" />
               <div className="absolute bottom-6 right-6 z-20 text-right">
                  <h3 className="text-emerald-400 font-black uppercase tracking-widest text-sm bg-black/60 px-2 py-1 inline-block backdrop-blur-sm rounded">Krama</h3>
                  <p className="text-white text-xs mt-1 drop-shadow-md">Structured. Pruned. Alive.</p>
               </div>
            </div>
            <div className="absolute top-0 bottom-0 w-1 bg-white z-20 shadow-[0_0_20px_rgba(255,255,255,0.5)]" style={{ left: `${sliderPosition}%` }}>
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
                  <MoveHorizontal size={16} className="text-stone-900" />
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. PRICING */}
      <section className="py-24 bg-emerald-950 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>
        <div className="max-w-4xl mx-auto text-center mb-16 relative z-10">
          <h2 className="text-4xl font-black text-emerald-50 mb-2">Cheaper Than Retaking the Exam.</h2>
          <p className="text-emerald-400 max-w-2xl mx-auto">
            Your tuition cost thousands. Your time is priceless. Protect your investment for less than the price of a coffee.
          </p>
        </div>

        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10 items-stretch">
          <div className="p-8 rounded-3xl bg-[#FDFBF7] relative hover:scale-[1.01] transition-transform duration-300 flex flex-col opacity-90">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-black text-stone-600">The Wild</h3>
                <p className="text-stone-400 text-[10px] font-bold uppercase tracking-widest">Casual Learners</p>
              </div>
              <Sprout className="text-stone-400" size={24}/>
            </div>
            <div className="text-5xl font-serif text-stone-900 mb-6">₹0</div>
            <ul className="space-y-4 mb-8 text-stone-600 text-sm flex-grow">
              <li className="flex gap-3 items-center"><CheckCircle2 size={16} className="text-stone-400"/> Basic Repetition</li>
              <li className="flex gap-3 items-center"><CheckCircle2 size={16} className="text-stone-400"/> 500 Topics Limit</li>
              <li className="flex gap-3 items-center text-amber-700 font-bold bg-amber-50 p-2 rounded"><XCircle size={16} /> Analytics Hidden</li>
              <li className="flex gap-3 items-center text-amber-700 font-bold bg-amber-50 p-2 rounded"><XCircle size={16} /> No Decay Alerts</li>
            </ul>
            <button onClick={() => router.push('/signup')} className="w-full py-4 rounded-xl border-2 border-dashed border-stone-300 font-bold text-stone-500 hover:border-amber-600 hover:text-amber-600 transition-all">
              Plant a Seed (Risk: High)
            </button>
          </div>

          <div className="p-8 rounded-3xl border-4 border-amber-400 bg-[#064e3b] text-white relative shadow-2xl transform md:-translate-y-4 flex flex-col">
            <div className="absolute top-0 right-0 bg-amber-400 text-amber-900 text-[10px] font-black px-4 py-1 rounded-bl-xl rounded-tr-lg uppercase tracking-widest">
              One-Time Payment
            </div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-black text-white">Evergreen</h3>
                <p className="text-emerald-300 text-[10px] font-bold uppercase tracking-widest">For Empire Builders</p>
              </div>
              <Anchor className="text-amber-400" size={24}/>
            </div>
            <div className="text-5xl font-serif text-white mb-2">
              ₹399
            </div>
            <p className="text-emerald-200 text-xs mb-8">Lifetime Access. No Subscriptions.</p>
            <ul className="space-y-4 mb-8 text-emerald-50 text-sm font-medium flex-grow">
              <li className="flex gap-3 items-center"><CheckCircle2 size={16} className="text-amber-400"/> Unlimited Tracking</li>
              <li className="flex gap-3 items-center"><CheckCircle2 size={16} className="text-amber-400"/> Predictive Decay (See the future)</li>
              <li className="flex gap-3 items-center"><CheckCircle2 size={16} className="text-amber-400"/> 'Trajectory' Graph (Pass/Fail)</li>
              <li className="flex gap-3 items-center"><CheckCircle2 size={16} className="text-amber-400"/> Priority Protection</li>
            </ul>
            <button onClick={() => router.push('/signup')} className="w-full py-4 rounded-xl bg-amber-400 text-amber-900 font-bold hover:bg-amber-300 transition-all shadow-[0_0_20px_rgba(251,191,36,0.3)]">
              Secure Your Knowledge
            </button>
          </div>
        </div>
      </section>

      {/* 8. PWA INSTALLATION */}
      <section className="py-24 px-6 bg-[#FDFBF7] border-t border-stone-200">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold uppercase tracking-widest mb-4">
            <Download size={12}/> Install Krama
          </div>
          <h2 className="text-3xl font-black text-emerald-950 mb-4">Your Pocket Garden.</h2>
          <p className="text-stone-500">Krama installs directly on your device. No app store clutter. Offline ready.</p>
        </div>
        <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-8 bg-white border border-stone-200 rounded-2xl shadow-sm flex flex-col items-center hover:border-emerald-200 transition-colors group">
            <Apple className="w-12 h-12 text-stone-300 group-hover:text-stone-800 transition-colors mb-4" />
            <h3 className="text-lg font-bold text-stone-900 mb-2">iOS</h3>
            <p className="text-stone-500 text-sm text-center leading-relaxed">
              Open in Safari <br/> Tap <span className="text-emerald-700 font-bold bg-emerald-50 px-1 rounded">Share</span> → "Add to Home Screen"
            </p>
          </div>
          <div className="p-8 bg-white border border-stone-200 rounded-2xl shadow-sm flex flex-col items-center hover:border-emerald-200 transition-colors group">
            <Smartphone className="w-12 h-12 text-stone-300 group-hover:text-stone-800 transition-colors mb-4" />
            <h3 className="text-lg font-bold text-stone-900 mb-2">Android</h3>
            <p className="text-stone-500 text-sm text-center leading-relaxed">
              Open in Chrome <br/> Tap <span className="text-emerald-700 font-bold bg-emerald-50 px-1 rounded">Menu (⋮)</span> → "Install App"
            </p>
          </div>
        </div>
      </section>

      {/* 9. FAQ */}
      <section className="py-24 bg-stone-100 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="mb-12 border-l-4 border-red-600 bg-white p-6 rounded-r-lg shadow-sm">
            <h3 className="text-red-700 font-black text-lg uppercase tracking-widest flex items-center gap-2 mb-2">
              <AlertTriangle size={20}/> Read Before You Buy
            </h3>
            <p className="text-stone-700 font-medium">
              <span className="font-bold">Is this a course? No.</span> <br/>
              <span className="font-bold">Are there video lectures? No.</span> <br/>
              Krama is a <span className="underline decoration-red-400 decoration-2 underline-offset-2">Tool</span>, not a Teacher. We provide the structure; you do the work. <br/>
              <span className="text-xs text-stone-500 uppercase font-bold mt-2 block">No Refunds on Lifetime Plans.</span>
            </p>
          </div>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-stone-900">Hard Truths.</h2>
            <p className="text-stone-500 font-serif italic">"We don't answer politely. We answer accurately."</p>
          </div>
          <div className="space-y-4">
            {[
              { q: "Is this a flash card provider site?", a: "No we do not provide you with any flash cards or pack of cards, for that please use other sites or apps. This is jusr a To do list with retention logic thats it for now, maybe in future ...... " },
              { q: "What happens if I stop paying?", a: "There is no 'stopping'. It is a one-time payment. You own it forever. The garden never closes." },
              { q: "I don't have time to review every day.", a: "That is exactly why you are here. You are currently wasting hours restudying things you've already forgotten. Our algorithm actually reduces your study time by showing you only what is about to die. We don't ask for more time; we ask for efficiency." },
              { q: "Is this guaranteed to make me pass?", a: "No tool can save you if you refuse to do the work. We just make sure that the work you do actually sticks. If you tend the garden, it grows. If you ignore it, it dies. The choice is yours." }
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-xl border border-stone-200 overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex justify-between items-center p-6 text-left font-bold text-stone-800 hover:bg-stone-50 transition-colors">
                  {item.q}
                  <ChevronDown 
                    size={20} 
                    className={`text-stone-400 transition-transform duration-300 ${openFaq === i ? 'rotate-180' : ''}`} 
                  />
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="p-6 pt-0 text-stone-600 text-sm leading-relaxed border-t border-stone-100 bg-stone-50/50">
                        {item.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 10. FOOTER */}
      <footer className="bg-emerald-950 text-emerald-200 py-20 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <Sprout size={48} className="mx-auto text-emerald-500 mb-6" />
          <h2 className="text-3xl font-black text-white mb-4">Your garden is waiting.</h2>
          <p className="text-emerald-400 mb-10">Every second you wait, a connection in your brain weakens.</p>
          <button onClick={() => router.push('/signup')} className="bg-white text-emerald-900 px-10 py-4 rounded-full font-bold hover:bg-emerald-100 transition-colors shadow-lg hover:shadow-xl">
            Start Tending Now
          </button>
          <div className="mt-16 text-xs text-emerald-800 font-mono uppercase tracking-widest">
            © 2025 KRAMA OS • CULTIVATE WISDOM
          </div>
        </div>
      </footer>

    </div>
  );
}