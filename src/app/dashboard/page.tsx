'use client';
export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sprout, Plus, BarChart3, 
  CheckCircle2, X, Search, Calendar as CalIcon,
  Trash2, Upload, ChevronDown,
  Bookmark, BookOpen, Warehouse, Activity, 
  Sparkles, Grid, Shield, User, Fingerprint, LogOut,
  Crown, RefreshCcw, AlertTriangle, Lock, Edit3
} from 'lucide-react';
import type { AuthChangeEvent } from '@supabase/supabase-js';

// --- IMPORTS ---
import ProUpgradeModal from '@/components/ProUpgradeModal';
import { reviewTopic, type Topic } from '@/lib/logic';
import IntelView from '@/components/IntelView';
import TargetClock from '@/components/TargetClock';
import Greenhouse from '@/components/Greenhouse';
import MocksModal from '@/components/mocks/MocksModal';

// --- CONFIGURATION ---
const CATEGORY_PRESETS = ["Study", "Work", "Other"];
const DEFAULT_SPACING = "0, 1, 3, 7, 14, 30";
const DAILY_FREE_LIMIT = 5; 

const GARDEN_QUOTES = [
  "Observation: Neglect leads to rapid entropic decay.",
  "Field Note: Roots require stress to deepen.",
  "Hypothesis: Consistency outperforms intensity.",
  "Status: The specimen is fragile. Do not look away.",
  "Law of Harvest: You cannot cheat the soil.",
];

const WITTY_MESSAGES = {
  success: ["Specimen Preserved.", "Growth Recorded.", "Vitality Restored.", "Entropy Delayed."],
  error: ["Seed Rejected.", "Soil too acidic.", "Data Corrupted.", "Signal Lost."],
  delete: ["Specimen Discarded.", "Returned to Earth.", "Pruned.", "Archived."],
  neutral: ["Observation Logged.", "Time passes.", "The cycle continues.", "No anomalies detected."]
};

// ==========================================
// INTERNAL COMPONENTS (Restored to Main File)
// ==========================================

// 1. SPECIMEN TAG (The Card Item)
const SpecimenTag = ({ topic, onWater, onCompost }: { topic: Topic, onWater: (t: Topic) => void, onCompost: (id: string) => void }) => (
  <div className="relative bg-white border-2 border-stone-800 p-4 mb-3 shadow-[4px_4px_0_0_#1c1917] hover:-translate-y-1 transition-transform group rounded-sm">
    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-4 bg-stone-200 rounded-full border-2 border-stone-800 z-10"></div>
    <div className="flex justify-between items-start mb-2 mt-2">
      <span className="font-mono text-xs text-stone-700 uppercase tracking-tight border border-stone-800 px-1 font-bold">{topic.category.toUpperCase()}</span>
      <div className="flex items-center gap-1 font-mono text-xs font-black text-red-900 bg-red-100 px-2 py-0.5 border border-red-900">
        <AlertTriangle size={12} strokeWidth={3} /> OVERDUE
      </div>
    </div>
    <h4 className="font-serif text-lg font-black text-stone-900 leading-tight mb-4 line-clamp-2">{topic.title}</h4>
    <div className="flex gap-2">
      <button onClick={() => onWater(topic)} className="flex-1 bg-stone-900 text-stone-50 py-2 text-xs font-black uppercase tracking-widest hover:bg-emerald-900 transition-colors shadow-sm">Study Specimen</button>
      <button onClick={() => onCompost(topic.id)} className="px-3 border-2 border-stone-300 text-stone-400 hover:text-red-600 hover:border-red-600 transition-colors"><Trash2 size={16} strokeWidth={2.5}/></button>
    </div>
  </div>
);

// 2. MAIN TREE (The Visualizer)
const MainTree = ({ witherCount }: { witherCount: number }) => {
  const health = Math.max(0, 100 - (witherCount * 10));
  const isWithered = health < 50;
  return (
    <div className="relative w-72 h-72 flex flex-col items-center justify-end">
      <svg className="absolute w-0 h-0"><defs><filter id="ink-bleed"><feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="3" result="noise" /><feDisplacementMap in="SourceGraphic" in2="noise" scale="4" /></filter></defs></svg>
      <svg viewBox="0 0 200 300" className="w-full h-full z-10" style={{ filter: 'url(#ink-bleed)' }}>
        <path d="M95,300 C95,250 85,200 100,150 C115,100 100,50 100,50" stroke="#1c1917" strokeWidth="6" fill="none" strokeLinecap="square" />
        {health > 20 && <path d="M100,150 C80,130 60,140 50,120" stroke="#1c1917" strokeWidth="3" fill="none" />}
        {health > 40 && <path d="M100,120 C120,100 140,110 150,90" stroke="#1c1917" strokeWidth="3" fill="none" />}
        {health > 0 && (<g className="transition-colors duration-1000" fill={isWithered ? "#9a3412" : "#14532d"}><circle cx="100" cy="50" r={health > 80 ? "25" : "10"} opacity="0.9" />{health > 40 && <circle cx="50" cy="120" r="15" opacity="0.8" />}{health > 60 && <circle cx="150" cy="90" r="20" opacity="0.8" />}{health > 90 && <circle cx="80" cy="80" r="18" opacity="0.7" />}</g>)}
      </svg>
      <div className="mt-4 border-y-2 border-stone-900 py-1 px-4"><span className="font-mono text-xs font-black uppercase tracking-widest text-stone-900">Vitality: {health}%</span></div>
    </div>
  );
};

// 3. ACTIVITY HEATMAP (Longitudinal Data)
const ActivityHeatmap = ({ topics, isUnlocked }: { topics: Topic[], isUnlocked: boolean }) => {
  const generateYearData = () => {
    const data = [];
    const today = new Date();
    for (let i = 364; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toDateString();
      const count = topics.filter(t => new Date(t.created_at).toDateString() === dateStr).length;
      data.push({ date: d, count });
    }
    return data;
  };
  const data = generateYearData();
  const getColor = (count: number) => {
    if (count === 0) return 'bg-stone-200';
    if (count === 1) return 'bg-emerald-200';
    if (count <= 3) return 'bg-emerald-400';
    if (count <= 5) return 'bg-emerald-600';
    return 'bg-emerald-900';
  };
  return (
    <div className="mt-8 bg-white border-2 border-stone-900 p-6 shadow-[6px_6px_0_#e7e5e4] relative overflow-hidden mb-8" style={{ borderRadius: '15px 255px 15px 255px / 255px 15px 225px 15px' }}>
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-serif text-lg font-black text-stone-900 flex items-center gap-2"><Grid size={18}/> Longitudinal Activity</h3>
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-stone-400"><span>DORMANT</span><div className="flex gap-1"><div className="w-2 h-2 bg-stone-200"></div><div className="w-2 h-2 bg-emerald-200"></div><div className="w-2 h-2 bg-emerald-400"></div><div className="w-2 h-2 bg-emerald-600"></div><div className="w-2 h-2 bg-emerald-900"></div></div><span>ACTIVE</span></div>
      </div>
      <div className="relative">
        <div className={`grid grid-rows-7 grid-flow-col gap-1 overflow-x-auto pb-2 ${!isUnlocked? 'blur-sm opacity-50 select-none pointer-events-none' : ''}`}>
           {data.map((day, i) => <div key={i} className={`w-2 h-2 md:w-3 md:h-3 rounded-sm ${getColor(day.count)}`} title={isUnlocked ? `${day.date.toLocaleDateString()}: ${day.count} specimens` : ''}></div>)}
        </div>
        {!isUnlocked && (
          <div className="absolute inset-0 flex items-center justify-center z-10"><div className="bg-stone-900/90 text-white p-4 border-2 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)] text-center max-w-xs transform -rotate-1"><Shield size={24} className="mx-auto text-emerald-400 mb-2" /><h4 className="font-black uppercase tracking-widest text-xs mb-1 text-emerald-400">Classified Data</h4><p className="font-serif text-stone-300 text-xs italic mb-3">Longitudinal analysis is restricted to Pro Scholars.</p><div className="text-xs font-mono font-bold bg-emerald-900 text-emerald-100 py-1 px-2 uppercase">Upgrade to Decode</div></div></div>
        )}
      </div>
    </div>
  );
};

// 4. FIELD IDENTITY CARD (Profile Modal)
const FieldIdentityCard = ({ isOpen, onClose, profile, user, onLogout }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4" onClick={onClose}>
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-[#FDFBF7] border-4 border-black p-8 max-w-md w-full relative shadow-[12px_12px_0_#000]" onClick={(e) => e.stopPropagation()}>
          <div className="absolute top-0 right-0 bg-black text-white px-4 py-1 text-xs font-black uppercase tracking-widest">FIELD IDENTITY CARD</div>
          <div className="mt-6 flex gap-6 items-start">
              <div className="w-24 h-24 border-4 border-black bg-stone-200 shrink-0 overflow-hidden flex items-center justify-center"><User size={48} className="text-stone-400" /></div>
              <div className="space-y-1">
                <div className="text-xs font-mono text-stone-500 uppercase tracking-widest font-black">Name</div><div className="text-2xl font-serif font-black text-black leading-none uppercase">{profile?.name}</div>
                <div className="text-xs font-mono text-stone-500 uppercase tracking-widest font-black mt-3">Email</div><div className="text-sm font-bold text-black">{user?.email}</div>
                <div className="flex gap-2 mt-4"><div className="bg-black text-white px-2 py-1 text-xs font-black uppercase tracking-widest border border-black">TIER: {profile?.is_admin ? 'ADMIN' : profile?.tier?.toUpperCase()}</div><div className="bg-emerald-100 text-emerald-900 px-2 py-1 text-xs font-black uppercase tracking-widest border border-emerald-900 flex items-center gap-1"><Shield size={10} /> {profile?.tier === 'pro' ? 'UNRESTRICTED' : 'LIMITED'}</div></div>
              </div>
          </div>
          <div className="mt-8 pt-6 border-t-2 border-dashed border-stone-300 flex justify-between items-end">
              <div><div className="text-xs font-black text-stone-400 uppercase tracking-widest">Scholar Since</div><div className="font-mono text-xs font-bold text-black">{new Date(profile?.created_at).toLocaleDateString()}</div></div>
              <Fingerprint size={48} className="text-stone-200" />
          </div>
          <div className="mt-6"><button onClick={onLogout} className="w-full py-3 border-2 border-red-900 text-red-900 font-black uppercase text-xs hover:bg-red-50 transition-colors flex items-center justify-center gap-2"><LogOut size={16}/> Resign Commission (Log Out)</button></div>
        </motion.div>
    </div>
  );
};

// 5. DANGER ZONE (Delete/Reset Buttons)
const DangerZone = ({ onDeleteAccount, onResetData, onUnlockPro, isPro }: any) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
      <button onClick={onDeleteAccount} className="flex flex-col items-center justify-center p-6 border-2 border-stone-300 text-stone-400 hover:border-red-900 hover:text-red-900 hover:bg-red-50 transition-all group">
        <Trash2 size={24} className="mb-2 group-hover:animate-bounce" /><span className="text-xs font-black uppercase tracking-widest">Delete Existence</span>
      </button>
      <button onClick={onResetData} className="flex flex-col items-center justify-center p-6 border-2 border-stone-300 text-stone-400 hover:border-orange-600 hover:text-orange-600 hover:bg-orange-50 transition-all group">
        <RefreshCcw size={24} className="mb-2 group-hover:rotate-180 transition-transform duration-500" /><span className="text-xs font-black uppercase tracking-widest">Wipe Memory (Reset)</span>
      </button>
      {!isPro ? (
        <button onClick={onUnlockPro} className="flex flex-col items-center justify-center p-6 border-4 border-stone-900 bg-stone-900 text-white hover:bg-stone-800 hover:scale-[1.02] transition-all shadow-[8px_8px_0_#d97706]">
          <Crown size={24} className="mb-2 text-yellow-400" /><span className="text-xs font-black uppercase tracking-widest text-yellow-100">Unlock Potential</span>
        </button>
      ) : (
        <div className="flex flex-col items-center justify-center p-6 border-2 border-emerald-900 bg-emerald-50 text-emerald-900 opacity-80 cursor-default">
          <Shield size={24} className="mb-2" /><span className="text-xs font-black uppercase tracking-widest">Pro Status Active</span>
        </div>
      )}
  </div>
);

// ==========================================
// MAIN DASHBOARD COMPONENT
// ==========================================

export default function ScientificDashboard() {
  const supabase = createClient();
  const router = useRouter();
  
  // --- STATE ---
  const [showRefreshPopup, setShowRefreshPopup] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  
  const isAdmin = profile?.is_admin === true;
  const isPro = profile?.tier === 'pro' || profile?.tier === 'PRO_LIFETIME' || profile?.is_admin === true;
  const isProOrAdmin = isPro || isAdmin;
  
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'overgrowth' | 'tending' | 'roots' | 'climate' | 'greenhouse' | 'syllabus' | 'pragati'>('overgrowth');
  const [quote, setQuote] = useState(GARDEN_QUOTES[0]);
  
  // DATA STATE
  const [allTopics, setAllTopics] = useState<Topic[]>([]);
  const [witherList, setWitherList] = useState<Topic[]>([]); // Due
  const [growingList, setGrowingList] = useState<Topic[]>([]); // Progress
  const [harvestedList, setHarvestedList] = useState<Topic[]>([]); // Completed
  
  // UI STATE
  const [newSeed, setNewSeed] = useState("");
  const [category, setCategory] = useState("Study");
  const [customCategory, setCustomCategory] = useState("");
  const [isCustomCat, setIsCustomCat] = useState(false);
  const [spacingSchedule, setSpacingSchedule] = useState(DEFAULT_SPACING);
  const [showAdvancedSeed, setShowAdvancedSeed] = useState(false);
  const [isPlanting, setIsPlanting] = useState(false);
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const [searchWither, setSearchWither] = useState("");
  const [searchNursery, setSearchNursery] = useState(""); 
  const [searchArchive, setSearchArchive] = useState("");
  const [showHarvested, setShowHarvested] = useState(false);
  const [showProfile, setShowProfile] = useState(false); 
  const [isMocksOpen, setIsMocksOpen] = useState(false);

  // MODAL STATES
  const [sarcasticWarning, setSarcasticWarning] = useState(false);
  const [showProModal, setShowProModal] = useState(false);
  const [alertState, setAlertState] = useState<{ show: boolean, msg: string, type: 'success' | 'error' | 'neutral' }>({ show: false, msg: '', type: 'neutral' });
  const [confirmState, setConfirmState] = useState<{ show: boolean, msg: string, onConfirm: () => void } | null>(null);

  // CALENDAR STATE
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [popupTopics, setPopupTopics] = useState<Topic[]>([]);

  // DAILY PROGRESS
  const [dailyCount, setDailyCount] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('krama_daily_count');
      const date = localStorage.getItem('krama_daily_date');
      const today = new Date().toDateString();
      if (date !== today) return 0; 
      return saved ? parseInt(saved) : 0;
    }
    return 0;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('krama_daily_count', dailyCount.toString());
      localStorage.setItem('krama_daily_date', new Date().toDateString());
    }
  }, [dailyCount]);

  // --- HELPER: ALERTS ---
  const showAlert = (type: 'success' | 'error' | 'delete', customMsg?: string) => {
    // @ts-ignore
    const msgs = WITTY_MESSAGES[type];
    const randomMsg = msgs ? msgs[Math.floor(Math.random() * msgs.length)] : "";
    const finalMsg = customMsg || randomMsg || "Action confirmed.";
    setAlertState({ 
      show: true, 
      msg: finalMsg, 
      type: type === 'delete' ? 'neutral' : type 
    });
    setTimeout(() => setAlertState(prev => ({ ...prev, show: false })), 3000);
  };

  // --- HELPER: DATE FORMATTING ---
  const formatDateKey = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const getIsoDateKey = (isoString: string) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return formatDateKey(new Date(date.getFullYear(), date.getMonth(), date.getDate()));
  };

  // --- INITIALIZATION ---
  useEffect(() => {
    let authSubscription: any;
    const init = async () => {
      if (typeof window !== 'undefined' && localStorage.getItem('readable_mode') === 'on') {
        document.body.classList.add('readable');
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/'); return; }
      setUser(user);

      const { data } = supabase.auth.onAuthStateChange((event: AuthChangeEvent) => {
        if (event === 'SIGNED_OUT') router.push('/');
      });
      authSubscription = data?.subscription;

      const { data: profileData } = await supabase
        .from('profiles')
        .select('name, tier, is_admin, created_at, target_exam_date')
        .eq('user_id', user.id)
        .maybeSingle();

      setProfile(profileData || {
        name: user.email?.split('@')[0],
        tier: 'free',
        is_admin: false,
        created_at: new Date().toISOString(),
      });

      const { count } = await supabase
        .from('enrolled_exams')
        .select('exam_id', { count: 'exact', head: true })
        .eq('user_id', user.id);

      const dismissed = sessionStorage.getItem('exam_selector_dismissed') === 'true';

      if (count === 0 && !dismissed && !profileData?.is_admin) {
        sessionStorage.setItem('exam_selector_dismissed', 'true');
        router.push('/syllabus');
        return;
      }

      setLoading(false);
      fetchTopics();
      setQuote(GARDEN_QUOTES[Math.floor(Math.random() * GARDEN_QUOTES.length)]);
    };
    init();
    return () => { authSubscription?.unsubscribe(); };
  }, [router, supabase]);

  const fetchTopics = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return;

    const { data, error } = await supabase.from('topics').select('*').eq('user_id', authUser.id);
    if (error) { showAlert('error', 'Failed to load topics.'); return; }

    if (data) {
      setAllTopics(data);
      const todayKey = formatDateKey(new Date());
      const due: Topic[] = [];
      const prog: Topic[] = [];
      const comp: Topic[] = [];

      data.forEach((t: Topic) => {
        if (t.status === 'completed') { comp.push(t); return; }
        if (!t.next_review) { due.push(t); return; }
        const reviewKey = getIsoDateKey(t.next_review);
        if (reviewKey <= todayKey) due.push(t);
        else prog.push(t);
      });

      setWitherList(due);
      setGrowingList(prog);
      setHarvestedList(comp);
    }
  };

  const handlePlantSeed = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return;
    if (!newSeed.trim() || isPlanting) return;
    
    const isPro = profile?.tier === 'pro' || profile?.tier === 'PRO_LIFETIME' || profile?.is_admin === true;    
    if (!isPro) {
        const createdToday = allTopics.filter(
          t => new Date(t.created_at).toDateString() === new Date().toDateString()
        ).length;
        if (createdToday >= DAILY_FREE_LIMIT) {
            showAlert('error', `Daily Limit Reached (${DAILY_FREE_LIMIT}). Upgrade for unlimited access.`);
            return;
        }
    }

    setIsPlanting(true);
    const finalCategory = isCustomCat ? customCategory : category;
    if (!finalCategory) { showAlert('error', "Category required."); setIsPlanting(false); return; }

    const tempTopic = {
      user_id: authUser.id,
      title: newSeed, 
      category: finalCategory, 
      status: 'active',
      next_review: new Date().toISOString(), 
      last_gap: 0,
      custom_intervals: showAdvancedSeed ? spacingSchedule : null
    };
    
    const { data, error } = await supabase.from('topics').insert(tempTopic).select().single();
    if (error) {
      showAlert('error', error.message);
    } else if (data) {
      showAlert('success', "Specimen Cataloged.");
      setAllTopics(prev => [...prev, data]);
      setWitherList(prev => [...prev, data]);
      setDailyCount(prev => prev + 1);
      setNewSeed(""); setIsCustomCat(false); setCustomCategory("");
    }
    setIsPlanting(false);
  };

  const handleWater = async (topic: Topic) => {
      if (reviewingId === topic.id) return;
      setReviewingId(topic.id);
      setWitherList(prev => prev.filter(t => t.id !== topic.id));
      showAlert('success');
      try { 
        await reviewTopic(supabase, topic); 
        fetchTopics(); 
      } catch (e) { 
        showAlert('error', 'Review failed. Please retry.');
        fetchTopics();
      } finally {
        setReviewingId(null);
      }
  };

  const handleCompost = (id: string) => {
    setConfirmState({
      show: true,
      msg: "Discard this specimen from the archives?",
      onConfirm: async () => {
        setConfirmState(null);
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) return;
        const { error } = await supabase.from('topics').delete().eq('id', id).eq('user_id', authUser.id);
        if (error) { showAlert('error', 'Delete failed.'); fetchTopics(); return; }
        showAlert('delete');
        fetchTopics();
      }
    });
  };

  const handleCloudSync = () => {
    if (!isProOrAdmin) { showAlert('error', 'Cloud backups are a Pro feature.'); setShowProModal(true); return; }
    showAlert('success', "Archiving Field Notes...");
  };

   const handleBurnArchives = async () => {
    if (!isProOrAdmin) { showAlert('error', 'Apocalypse mode is Pro-only. Discipline first.'); setShowProModal(true); return; }
    setConfirmState({
      show: true,
      msg: "This will erase all specimens from the field. Soil will be reset to ash. Proceed?",
      onConfirm: async () => {
        setConfirmState(null);
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) return;
        const { error } = await supabase.from('topics').delete().eq('user_id', authUser.id);
        if (error) { showAlert('error', 'Reset failed.'); return; }
        setAllTopics([]); setWitherList([]); setGrowingList([]); setHarvestedList([]);
        showAlert('delete', "ALL MEMORIES WIPED.");
      }
    });
  };

  const handleDeleteAccount = async () => {
    setSarcasticWarning(false);
    showAlert('error', 'Identity collapse initiated.');
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;
      await supabase.from('topics').delete().eq('user_id', authUser.id);
      await supabase.from('profiles').update({ deleted_at: new Date().toISOString() }).eq('user_id', user.id);
      await supabase.auth.signOut();
      router.push('/');
    } catch (e) {
      showAlert('error', 'Collapse failed. System resisted deletion.');
    }
  };

  const handleUnlockPro = () => setShowProModal(true);

  // CALENDAR
  const getCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const days = [];
    for (let i = 0; i < firstDayIndex; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(new Date(year, month, d));
    return days;
  };

  const handleDateClick = (date: Date) => {
    if (!date) return;
    const clickedKey = formatDateKey(date);
    const matches = allTopics.filter(t => {
      if (!t.next_review) return false;
      const topicKey = getIsoDateKey(t.next_review);
      return topicKey === clickedKey;
    });
    setSelectedDate(date.toDateString());
    setPopupTopics(matches);
  };

  if (loading) return <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center text-stone-900 font-serif font-bold tracking-widest text-xl">OPENING ARCHIVES...</div>;
  const isOvergrown = witherList.length > 5;

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-900 font-sans selection:bg-stone-900 selection:text-white pb-32 relative">
      
      {/* BACKGROUNDS */}
      <div className={`fixed inset-0 pointer-events-none z-50 transition-opacity duration-1000 mix-blend-multiply ${isOvergrown ? 'opacity-100' : 'opacity-0'}`} style={{ background: 'radial-gradient(circle, transparent 60%, #b45309 150%)' }}></div>
      <div className="fixed inset-0 pointer-events-none z-0 opacity-40 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]"></div>

      {/* HEADER */}
      <header className="fixed top-0 w-full bg-[#FDFBF7]/90 backdrop-blur-md border-b-2 border-double border-stone-400 z-50 px-6 h-20 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
           <div className="w-10 h-10 border-2 border-stone-900 flex items-center justify-center bg-white shadow-[3px_3px_0_#000]">
             <Sprout className="text-stone-900" size={24} strokeWidth={2.5} />
           </div>
           <div>
             <h1 className="text-3xl font-black text-stone-900 tracking-tighter leading-none font-serif">KRAMA</h1>
             <p className="text-xs font-mono text-stone-600 uppercase tracking-[0.2em] mt-0.5 font-bold">Field Journal v16.0</p>
           </div>
        </div>
        <nav className="hidden md:flex items-center gap-6 ml-10 border-l-2 border-stone-300 pl-6">
          <Link href="/dashboard" className="text-xs font-black uppercase tracking-widest text-stone-600 hover:text-stone-900 transition">Dashboard</Link>
          <button onClick={() => setIsMocksOpen(true)} className="text-xs font-black uppercase tracking-widest text-stone-600 hover:text-stone-900 transition">Mocks</button>
          <Link href="/insights" className="text-xs font-black uppercase tracking-widest text-stone-600 hover:text-stone-900 transition">Insights</Link>
        </nav>
        {isPro && (
          <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-black border border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)] rounded-full animate-pulse">
             <Sparkles size={12} className="text-emerald-400" />
             <span className="text-xs font-black text-emerald-100 tracking-widest uppercase">PRO SCHOLAR</span>
          </div>
        )}
        {user && <TargetClock userId={user.id} initialTarget={profile?.target_exam_date} onUpdate={(newDate) => setProfile((prev: any) => ({ ...prev, target_exam_date: newDate }))} />}
        <button onClick={() => { document.body.classList.toggle('readable'); localStorage.setItem('readable_mode', document.body.classList.contains('readable') ? 'on' : 'off') }} className="px-3 py-2 border-2 border-stone-300 text-xs font-black uppercase hover:border-stone-900 hover:bg-stone-50 transition" title="Readable mode">Aa</button>
        <div className="flex items-center gap-4 cursor-pointer hover:opacity-70 transition-opacity" onClick={() => setShowProfile(true)}>
          <div className="text-right hidden sm:block">
            <div className="text-xs text-stone-500 uppercase font-bold tracking-widest">Scholar</div>
            <div className="text-sm font-serif font-bold text-stone-900">{profile?.name}</div>
          </div>
          <div className="w-10 h-10 bg-stone-900 text-white flex items-center justify-center text-sm font-bold font-serif shadow-[4px_4px_0_#14532d] border-2 border-stone-900">
            {(profile?.name || user?.email || 'U').charAt(0).toUpperCase()}
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="pt-32 px-4 md:px-8 max-w-[1600px] mx-auto z-10 relative">
        {activeView === 'overgrowth' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT COLUMN: LISTS */}
            <div className="lg:col-span-3 space-y-8">
              {/* SPECIMENS (DUE) */}
              <div>
                <div className="flex items-center justify-between mb-4 border-b-4 border-stone-900 pb-2">
                  <h3 className="font-serif text-2xl font-black text-stone-900">Specimens</h3>
                  <span className="font-mono text-sm font-bold bg-stone-900 text-white px-3 py-1">{witherList.length}</span>
                </div>
                <div className="relative mb-4">
                  <input placeholder="Search urgency..." className="w-full bg-white border-2 border-stone-300 p-2 pl-8 text-xs font-mono font-bold focus:border-stone-900 focus:outline-none placeholder:text-stone-500" value={searchWither} onChange={(e) => setSearchWither(e.target.value)} />
                  <Search size={14} className="absolute left-2 top-2.5 text-stone-400" strokeWidth={3}/>
                </div>
                <div className="max-h-[50vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-stone-900 scrollbar-track-transparent">
                  {witherList.length === 0 ? (
                    <div className="p-8 border-2 border-dashed border-stone-300 text-center"><CheckCircle2 className="mx-auto text-stone-300 mb-2" size={32}/><p className="text-sm font-mono text-stone-400 uppercase font-bold">All Specimens Cataloged</p></div>
                  ) : (
                    witherList.filter(t => t.title.toLowerCase().includes(searchWither.toLowerCase())).slice(0, 5).map(t => (
                      <SpecimenTag key={t.id} topic={t} onWater={handleWater} onCompost={handleCompost} />
                    ))
                  )}
                  {witherList.length > 5 && !searchWither && <div className="text-center py-3 text-xs text-stone-500 font-mono font-bold border-t-2 border-dashed border-stone-300 bg-stone-50">+ {witherList.length - 5} More Hidden (Use Search)</div>}
                </div>
              </div>

              {/* NURSERY (Growing) */}
              <div className="bg-stone-50 border-2 border-stone-200 p-4 shadow-[4px_4px_0_#d6d3d1]">
                  <div className="flex items-center justify-between mb-4 border-b-2 border-stone-300 pb-2">
                    <h3 className="font-serif text-lg font-black text-stone-700 flex items-center gap-2"><Activity size={18}/> Progress</h3>
                    <span className="font-mono text-xs font-bold bg-stone-200 text-stone-600 px-2 py-1">{growingList.length}</span>
                  </div>
                  <div className="space-y-2 max-h-[30vh] overflow-y-auto pr-1">
                    {growingList.length > 0 ? growingList.slice(0, 10).map(t => (
                      <div key={t.id} className="flex justify-between items-center bg-white p-2 border border-stone-200 shadow-sm">
                        <div className="truncate pr-2"><div className="text-sm font-bold text-stone-800 truncate">{t.title}</div><div className="text-xs font-mono text-stone-500 uppercase">{t.category}</div></div>
                        <div className="text-xs font-mono font-bold text-stone-400">{t.next_review ? new Date(t.next_review).toLocaleDateString(undefined, {month:'short', day:'numeric'}) : '-'}</div>
                      </div>
                    )) : <div className="text-sm text-stone-400 font-mono font-bold italic text-center py-4">No active growth.</div>}
                  </div>
              </div>
            </div>

            {/* CENTER COLUMN: TREE & ACTIONS */}
            <div className="lg:col-span-6 flex flex-col items-center">
              <div className="mb-8 text-center max-w-md"><p className="font-serif italic text-stone-600 text-xl leading-relaxed font-medium">"{quote}"</p></div>
              <div className="mb-12"><MainTree witherCount={witherList.length} /></div>
              <button 
                onClick={() => { if (witherList.length > 0) handleWater(witherList[0]); else showAlert('success', "No action required."); }}
                disabled={witherList.length === 0}
                className={`group relative px-16 py-5 border-4 border-stone-900 font-black uppercase tracking-[0.2em] text-sm transition-all active:translate-y-1 active:shadow-none ${witherList.length > 0 ? 'bg-stone-900 text-white shadow-[8px_8px_0_#14532d] hover:bg-stone-800' : 'bg-stone-200 text-stone-400 shadow-none cursor-not-allowed border-stone-300'}`}
              >
                {witherList.length > 0 ? "Perform Review" : "Research Complete"}
              </button>
              <div className="mt-12 flex flex-wrap justify-center gap-4">
                <button onClick={() => setActiveView('pragati')} className="flex items-center gap-2 px-6 py-3 border-2 border-stone-300 text-stone-700 font-mono text-xs font-bold uppercase hover:bg-white hover:border-stone-900 hover:text-stone-900 transition-all shadow-sm"><BarChart3 size={16}/> View Data</button>
                <button onClick={() => router.push('/syllabus')} className="flex items-center gap-2 px-6 py-3 border-2 border-stone-300 text-stone-700 font-mono text-xs font-bold uppercase hover:bg-white hover:border-stone-900 hover:text-stone-900 transition-all shadow-sm"><BookOpen size={16}/> Syllabus Tracker</button>
                <button onClick={() => setActiveView('greenhouse')} className="flex items-center gap-2 px-6 py-3 border-2 border-stone-300 text-stone-700 font-mono text-xs font-bold uppercase hover:bg-white hover:border-stone-900 hover:text-stone-900 transition-all shadow-sm"><Warehouse size={16}/> Greenhouse</button>
                <button onClick={handleCloudSync} className="flex items-center gap-2 px-6 py-3 border-2 border-stone-300 text-stone-700 font-mono text-xs font-bold uppercase hover:bg-white hover:border-stone-900 hover:text-stone-900 transition-all shadow-sm"><Upload size={16}/> Sync Log</button>
                <button onClick={() => setIsMocksOpen(true)} className="flex items-center gap-2 px-6 py-3 border-2 border-stone-300 text-stone-700 font-mono text-xs font-bold uppercase hover:bg-white hover:border-stone-900 hover:text-stone-900 transition-all shadow-sm"><Grid size={16}/> Mocks</button>
              </div>
            </div>

            {/* RIGHT COLUMN: ENTRY & ARCHIVES */}
            <div className="lg:col-span-3 space-y-8">
              <div className="bg-white border-2 border-stone-900 p-6 shadow-[6px_6px_0_#000]">
                <h3 className="font-serif text-xl font-black mb-4 flex items-center gap-2 text-stone-900"><Plus size={20} className="text-stone-400" strokeWidth={3}/> New Entry</h3>
                <div className="space-y-4">
                  <input placeholder="Subject Name..." className="w-full bg-stone-50 border-b-2 border-stone-300 p-2 text-base font-serif font-bold focus:outline-none focus:border-stone-900 placeholder:italic placeholder:text-stone-500 text-stone-900" value={newSeed} onChange={(e) => setNewSeed(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handlePlantSeed()} />
                  <div className="flex flex-wrap gap-2">
                    {CATEGORY_PRESETS.map(c => <button key={c} onClick={() => { setCategory(c); setIsCustomCat(false); }} className={`px-3 py-1 text-xs font-bold uppercase border-2 transition-all ${category === c && !isCustomCat ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-500 border-stone-200 hover:border-stone-900 hover:text-stone-900'}`}>{c}</button>)}
                  </div>
                  <button onClick={handlePlantSeed} disabled={isPlanting} className="w-full py-3 bg-stone-900 text-white text-xs font-black uppercase tracking-widest hover:bg-emerald-900 transition-all shadow-md active:translate-y-1 disabled:opacity-50">{isPlanting ? "CATALOGING..." : "CATALOG SPECIMEN"}</button>
                </div>
              </div>
              
              <div className="bg-stone-100 p-6 border-2 border-stone-200 shadow-inner">
                <div className="flex justify-between items-center mb-4"><h3 className="font-serif text-lg font-bold text-stone-600 flex items-center gap-2"><Bookmark size={16}/> Archives</h3><span className="font-mono text-xl font-bold text-stone-900">{harvestedList.length}</span></div>
                <button onClick={() => setShowHarvested(!showHarvested)} className="w-full flex items-center justify-between text-xs font-mono font-bold text-stone-500 hover:text-stone-900 border-t-2 border-stone-300 pt-3">{showHarvested ? "Close Drawer" : "Open Drawer"} <ChevronDown size={14} className={showHarvested ? 'rotate-180' : ''}/></button>
                <AnimatePresence>
                  {showHarvested && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} className="mt-4 space-y-2 overflow-hidden">
                      <input placeholder="Search archives..." className="w-full p-2 text-xs border border-stone-300 mb-2 font-mono font-bold" value={searchArchive} onChange={(e) => setSearchArchive(e.target.value)} />
                      {harvestedList.filter(t => t.title.toLowerCase().includes(searchArchive.toLowerCase())).slice(0, 5).map(t => (
                        <div key={t.id} className="flex justify-between items-center py-2 border-b border-stone-200 last:border-0 font-medium"><div><span className="line-through decoration-stone-400 truncate w-32 block text-sm font-bold text-stone-500">{t.title}</span></div><div className="text-xs text-stone-400 font-black italic">SECURE</div></div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {(activeView as string) !== 'overgrowth' && <button onClick={() => setActiveView('overgrowth' as any)} className="mb-6 flex items-center gap-2 text-xs text-stone-500 hover:text-stone-900 transition-colors uppercase tracking-widest font-bold"><ChevronDown className="rotate-90" size={14} /> Return to Lab</button>}
            {activeView === 'pragati' && <IntelView topics={allTopics} profile={profile} />}
            {activeView === 'syllabus' && <div className="text-center font-serif text-2xl font-bold text-stone-500 p-20">SYLLABUS TRACKER MODULE LOADING...</div>}
            {activeView === 'greenhouse' && <Greenhouse currentProgress={dailyCount} />}
          </motion.div>
        )}

        {/* BOTTOM SECTION */}
        {activeView === 'overgrowth' && (
          <div className="mt-8 mb-16 max-w-4xl mx-auto">
            {/* CALENDAR */}
            <div className="bg-white border-2 border-stone-900 p-4 shadow-[6px_6px_0_#e7e5e4] relative overflow-hidden" style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}>
                 <div className="flex justify-between items-center mb-4"><h3 className="font-serif text-lg font-black text-stone-900 flex items-center gap-2"><CalIcon size={18}/> Field Schedule</h3><div className="flex gap-4 font-mono text-xs font-bold text-stone-500"><button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} className="hover:text-stone-900">PREV</button><span>{currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' }).toUpperCase()}</span><button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} className="hover:text-stone-900">NEXT</button></div></div>
              <div className="grid grid-cols-7 gap-1">{['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => (<div key={d} className="text-center text-xs font-mono font-black text-stone-400 uppercase tracking-widest mb-1">{d}</div>))}{getCalendarDays().map((date, i) => { if (!date) { return <div key={`empty-${i}`} className="h-12 md:h-16"></div> } const cellDateKey = formatDateKey(date); const count = allTopics.filter(t => { if (!t.next_review) return false; const topicKey = getIsoDateKey(t.next_review); return topicKey === cellDateKey; }).length; return (<div key={i} onClick={() => handleDateClick(date)} className="h-12 md:h-16 border-2 border-stone-800 flex flex-col items-center justify-center cursor-pointer hover:bg-stone-50 transition-colors relative" style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}><span className="font-mono text-xs font-black text-stone-700">{date.getDate()}</span>{count > 0 && (<div className="absolute top-1 right-1 text-xs font-black text-white bg-stone-900 rounded-full w-4 h-4 flex items-center justify-center">{count}</div>)}</div>) })}</div>
            </div>

            <ActivityHeatmap topics={allTopics} isUnlocked={isProOrAdmin} />

            <DangerZone 
              onDeleteAccount={() => setSarcasticWarning(true)}
              onResetData={handleBurnArchives}
              onUnlockPro={handleUnlockPro}
              isPro={isProOrAdmin}
            />
          </div>
        )}
      </main>

      {/* MODALS */}
      <AnimatePresence>
        {alertState.show && <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60]"><div className={`px-6 py-3 border-2 shadow-[4px_4px_0_rgba(0,0,0,0.1)] flex items-center gap-3 font-mono text-xs font-bold uppercase tracking-wider ${alertState.type === 'error' ? 'bg-red-50 border-red-900 text-red-900' : 'bg-white border-stone-900 text-stone-900'}`}><div className={`w-2 h-2 rounded-full ${alertState.type === 'error' ? 'bg-red-600' : 'bg-stone-900'} animate-pulse`}></div>{alertState.msg}</div></motion.div>}
      </AnimatePresence>

      {confirmState && <div className="fixed inset-0 bg-stone-900/20 backdrop-blur-sm z-[100] flex items-center justify-center p-4"><div className="bg-[#FDFBF7] border-2 border-stone-900 p-8 max-w-sm w-full shadow-[8px_8px_0_#1c1917] text-center"><h3 className="text-xl font-black text-stone-900 mb-2 font-serif uppercase tracking-wider">Discard Specimen?</h3><p className="text-stone-600 text-sm mb-8 font-serif italic font-medium">This action cannot be undone. The knowledge will be lost.</p><div className="flex gap-4"><button onClick={() => setConfirmState(null)} className="flex-1 py-3 border-2 border-stone-200 text-stone-500 font-bold text-xs uppercase hover:border-stone-900 hover:text-stone-900">Keep</button><button onClick={confirmState.onConfirm} className="flex-1 py-3 bg-red-900 text-white border-2 border-red-900 font-bold text-xs uppercase hover:bg-red-800">Discard</button></div></div></div>}

      {selectedDate && <div className="fixed inset-0 bg-stone-900/10 backdrop-blur-sm z-[400] flex items-center justify-center p-4" onClick={() => setSelectedDate(null)}><div className="bg-white text-stone-900 max-w-xs w-full p-6 border-2 border-stone-900 shadow-[6px_6px_0_#9a3412]" onClick={(e) => e.stopPropagation()}><div className="flex justify-between items-center mb-6"><h3 className="font-bold font-serif text-stone-900 text-xl">{selectedDate}</h3><button onClick={() => setSelectedDate(null)}><X size={20} className="text-stone-400 hover:text-stone-900"/></button></div><ul className="space-y-3 max-h-64 overflow-y-auto">{popupTopics.length === 0 ? <li className="text-stone-400 text-xs font-mono uppercase tracking-widest text-center py-4 font-bold">No observations recorded.</li> : popupTopics.map(t => <li key={t.id} className="text-base border-b border-stone-100 pb-3 mb-2 last:border-0"><div className={`font-bold text-lg font-serif ${t.status === 'completed' ? 'line-through text-stone-400' : 'text-stone-900'}`}>{t.title}</div><div className="text-xs text-stone-500 uppercase tracking-wider font-bold mt-1">{t.category}</div></li>)}</ul></div></div>}

      <AnimatePresence>
        <FieldIdentityCard isOpen={showProfile} onClose={() => setShowProfile(false)} profile={profile} user={user} onLogout={async() => { await supabase.auth.signOut(); router.push('/'); }} />
      </AnimatePresence>

      <AnimatePresence>
        {sarcasticWarning && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-red-900/40 backdrop-blur-sm z-[700] flex items-center justify-center p-4"><motion.div initial={{ scale: 0.9, rotate: -2 }} animate={{ scale: 1, rotate: 0 }} className="bg-white border-4 border-red-600 p-8 max-w-sm w-full shadow-[10px_10px_0_#000] text-center relative overflow-hidden"><div className="absolute top-0 left-0 w-full bg-red-600 text-white text-xs font-black uppercase tracking-widest py-1">CRITICAL FAILURE IMMINENT</div><div className="my-6"><Trash2 size={48} className="mx-auto text-red-600 mb-4 animate-pulse" /><h2 className="font-black text-2xl text-stone-900 uppercase leading-none mb-4">Giving up already?</h2><p className="font-serif text-stone-600 italic mb-6">"The universe expands, but you choose to shrink? Confirming this will <span className="font-bold text-red-600">obliterate</span> your account."</p><div className="flex flex-col gap-3"><button onClick={() => setSarcasticWarning(false)} className="w-full py-3 bg-stone-900 text-white font-black uppercase text-xs hover:bg-stone-800">I WAS WRONG. GO BACK.</button><button onClick={async () => { setSarcasticWarning(false); try { const { data: { user: authUser } } = await supabase.auth.getUser(); if (!authUser) return; await supabase.from('topics').delete().eq('user_id', authUser.id); await supabase.from('profiles').update({ deleted_at: new Date().toISOString() }).eq('user_id', user.id); await supabase.auth.signOut(); router.push('/'); } catch (e) { showAlert('error', 'Collapse failed.'); } }} className="w-full py-3 border-2 border-red-600 text-red-600 font-black uppercase text-xs hover:bg-red-50">YES, I CHOOSE THE VOID.</button></div></div></motion.div></motion.div>}
      </AnimatePresence>

      <ProUpgradeModal open={showProModal} onClose={() => setShowProModal(false)} onSuccess={async () => { await supabase.auth.getUser(); setProfile((prev: any) => ({ ...(prev || {}), tier: 'pro' })); setShowProModal(false); setShowRefreshPopup(true); setTimeout(() => window.location.reload(), 6000); }} />
      <MocksModal open={isMocksOpen} onClose={() => setIsMocksOpen(false)} />
      
      {showRefreshPopup && <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm"><div className="bg-white border-4 border-emerald-700 p-8 max-w-sm w-full text-center shadow-[8px_8px_0_#065f46]"><h2 className="text-2xl font-black text-emerald-900 mb-4 uppercase tracking-widest">Payment Successful</h2><p className="text-stone-700 mb-6 font-serif">Your Pro access is activated.<br />Please refresh once to unlock all features.</p><button onClick={() => window.location.reload()} className="w-full py-3 bg-emerald-700 text-white font-black uppercase tracking-widest hover:bg-emerald-800 transition">Refresh Now</button></div></div>}

    </div>
  );
}