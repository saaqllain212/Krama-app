'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BookOpen, Loader2, ChevronDown, Search, X, Check, Sprout, Plus, Skull } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import TargetClock from '@/components/TargetClock';

// LOGIC & DATA IMPORTS
import { mergeSyllabusWithProgress, type SyllabusNode } from '@/lib/syllabusLogic';
import { EXAM_REGISTRY, EXAM_BUNDLES } from '@/lib/examRegistry';

// COMPONENT IMPORTS
import SyllabusTechTree from '@/components/SyllabusTechTree';
import SpecimenDrawer from '@/components/SpecimenDrawer';
import ExamSelector from '@/components/ExamSelector';

// --- HELPER: RECURSIVE SEARCH ---
function searchTree(nodes: SyllabusNode[], query: string, path: string = ""): { node: SyllabusNode, path: string }[] {
  if (!query) return [];
  let results: { node: SyllabusNode, path: string }[] = [];
  for (const node of nodes) {
    const currentPath = path ? `${path} > ${node.title}` : node.title;
    if (node.title.toLowerCase().includes(query.toLowerCase()) && node.type === 'leaf') {
      results.push({ node, path: path || "Root" });
    }
    if (node.children) {
      results = [...results, ...searchTree(node.children, query, currentPath)];
    }
  }
  return results;
}

const WITTY_MESSAGES = {
  success: ["Specimen Preserved.", "Growth Recorded.", "Vitality Restored.", "Entropy Delayed."],
  error: ["Seed Rejected.", "Soil too acidic.", "Data Corrupted.", "Signal Lost."],
  delete: ["Specimen Discarded.", "Returned to Earth.", "Pruned.", "Archived."],
  neutral: ["Observation Logged.", "Time passes.", "The cycle continues.", "No anomalies detected."]
};

export default function SyllabusPage() {
  const supabase = createClient();
  const router = useRouter();

  // --- CORE STATE ---
  const [selectedPaperId, setSelectedPaperId] = useState<string>('');
  const [treeData, setTreeData] = useState<SyllabusNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  
  // --- GAMIFICATION STATE ---
  const [completedCount, setCompletedCount] = useState(0);
  const [revertsUsed, setRevertsUsed] = useState(0);

  // --- UI / MODAL STATE ---
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ node: SyllabusNode, path: string }[]>([]);
  
  const [plantModalNode, setPlantModalNode] = useState<SyllabusNode | null>(null);
  const [drawerNode, setDrawerNode] = useState<SyllabusNode | null>(null);

  // --- ENROLLMENT STATE ---
  const [enrolledBundleIds, setEnrolledBundleIds] = useState<string[]>([]);
  const [userTier, setUserTier] = useState<'free' | 'pro'>('free');
  const [showSelector, setShowSelector] = useState(false);

  // --- CUSTOM ALERTS & CONFIRM ---
  const [alertState, setAlertState] = useState<{ show: boolean, msg: string, type: 'success' | 'error' | 'neutral' }>({ show: false, msg: '', type: 'neutral' });
  const [confirmState, setConfirmState] = useState<{ show: boolean, msg: string, action: () => void } | null>(null);

  // Helper for Alerts
  const showAlert = (type: 'success' | 'error' | 'delete', customMsg?: string) => {
    // @ts-ignore
    const msgs = WITTY_MESSAGES[type];
    const randomMsg = msgs ? msgs[Math.floor(Math.random() * msgs.length)] : customMsg;
    setAlertState({ show: true, msg: customMsg || randomMsg, type: type === 'delete' ? 'neutral' : type });
    setTimeout(() => setAlertState(prev => ({ ...prev, show: false })), 3000);
  };

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      setUser(user);

      const { data: profile } = await supabase.from('profiles').select('tier, is_admin').eq('user_id', user.id).single();
      const { data: enrollments } = await supabase.from('enrolled_exams').select('exam_id').eq('user_id', user.id);

      const isAdmin = profile?.is_admin === true;
      let bundleIds: string[] = [];
      let tier: 'free' | 'pro' = 'free';

      if (isAdmin) {
        bundleIds = EXAM_BUNDLES.map(b => b.id);
        tier = 'pro';
      } else {
        bundleIds = enrollments?.map(e => e.exam_id) || [];
        tier = profile?.tier || 'free';
      }

      setEnrolledBundleIds(bundleIds);
      setUserTier(tier);

      if (bundleIds.length === 0) {
        setShowSelector(true);
        setLoading(false); 
      } else {
        const firstValidBundle = EXAM_BUNDLES.find(b => b.id === bundleIds[0]);
        if (firstValidBundle && firstValidBundle.paperIds.length > 0) {
          setSelectedPaperId(firstValidBundle.paperIds[0]);
        } else {
          setLoading(false); 
        }
      }
    };
    init();
  }, [router]);

  useEffect(() => {
    if (!user || !selectedPaperId) return;
    const loadSyllabus = async () => {
      setLoading(true);
      setError(null);
      try {
        const exam = EXAM_REGISTRY.find(e => e.id === selectedPaperId);
        if (!exam) throw new Error("Paper definition not found");

        const response = await fetch(`/syllabi/${encodeURIComponent(exam.filename)}`);
        if (!response.ok) throw new Error(`File not found: ${exam.filename}`);
        const staticData = await response.json();

        const { data: progress } = await supabase.from('topics').select('origin_id, status, created_at').eq('user_id', user.id);
        const { data: profile } = await supabase.from('profiles').select('reverts_used').eq('user_id', user.id).single();

        setCompletedCount(progress?.filter(p => p.status === 'completed').length || 0);
        setRevertsUsed(profile?.reverts_used || 0);

        // @ts-ignore
        const mergedTree = mergeSyllabusWithProgress(staticData, progress || []);
        setTreeData(mergedTree);

      } catch (err: any) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadSyllabus();
  }, [selectedPaperId, user]);

  useEffect(() => {
    if (searchQuery.length > 2) {
      setSearchResults(searchTree(treeData, searchQuery));
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, treeData]);

  const handleNodeClick = (node: SyllabusNode) => {
    if (node.status === 'locked') {
      setPlantModalNode(node);
    } else {
      setDrawerNode(node);
    }
  };

  const handlePlantAction = async (status: 'active' | 'completed') => {
    if (!plantModalNode || !user) return;
    setTreeData(prev => updateNodeStatusLocal(prev, plantModalNode.id, status === 'active' ? 'growing' : 'harvested'));
    setPlantModalNode(null); 
    setSearchQuery("");
    if (status === 'completed') setCompletedCount(prev => prev + 1);
    
    const { error } = await supabase.from('topics').insert({
      user_id: user.id, title: plantModalNode.title, origin_id: plantModalNode.id, category: 'Syllabus', status: status, next_review: new Date().toISOString(), last_gap: 0
    });
    
    if (error) showAlert('error', error.message);
    else showAlert('success');
  };

  // --- REVERT (Custom Modal) ---
  const handleRevert = () => {
    if (!drawerNode || !user) return;
    setConfirmState({
      show: true,
      msg: "Spending 1 Revert Credit to un-master this topic. Are you sure?",
      action: async () => {
        setTreeData(prev => updateNodeStatusLocal(prev, drawerNode.id, 'growing'));
        setDrawerNode(prev => prev ? ({ ...prev, status: 'growing' }) : null);
        setRevertsUsed(prev => prev + 1);
        setCompletedCount(prev => Math.max(0, prev - 1));
        await supabase.from('topics').update({ status: 'active' }).eq('user_id', user.id).eq('origin_id', drawerNode.id);
        await supabase.from('profiles').update({ reverts_used: revertsUsed + 1 }).eq('user_id', user.id);
        setConfirmState(null);
        showAlert('success', "Decision Reverted.");
      }
    });
  };

  // --- NUCLEAR (Custom Modal) ---
  const handleNuclearReset = () => {
    setConfirmState({
      show: true,
      msg: "WARNING: THIS WILL BURN THE ENTIRE GARDEN. ALL PROGRESS LOST.",
      action: async () => {
        setLoading(true);
        await supabase.from('topics').delete().eq('user_id', user.id);
        await supabase.from('profiles').update({ reverts_used: 0 }).eq('user_id', user.id);
        window.location.reload();
      }
    });
  };

  // --- COMPOST (Custom Modal) ---
  const handleCompost = () => {
    if (!drawerNode || !user) return;
    setConfirmState({
      show: true,
      msg: "Compost this topic? It will return to the void.",
      action: async () => {
        setTreeData(prev => updateNodeStatusLocal(prev, drawerNode.id, 'locked'));
        setDrawerNode(null); 
        await supabase.from('topics').delete().eq('user_id', user.id).eq('origin_id', drawerNode.id);
        setConfirmState(null);
        showAlert('delete');
      }
    });
  };

  const handleAddBundle = async (bundleId: string) => {
    const { error } = await supabase.from('enrolled_exams').insert({ user_id: user.id, exam_id: bundleId });
    if (!error) {
      setEnrolledBundleIds(prev => [...prev, bundleId]);
      const newBundle = EXAM_BUNDLES.find(b => b.id === bundleId);
      if (newBundle && newBundle.paperIds.length > 0) setSelectedPaperId(newBundle.paperIds[0]);
      setShowSelector(false);
      showAlert('success', "Protocol Initialized.");
    } else {
      showAlert('error', error.message);
    }
  };

  const revertsAvailable = (5 + Math.floor(completedCount / 50) * 20) - revertsUsed;

  const updateNodeStatusLocal = (nodes: SyllabusNode[], targetId: string, newStatus: any): SyllabusNode[] => {
    return nodes.map(n => {
      if (n.id === targetId) return { ...n, status: newStatus };
      if (n.children) return { ...n, children: updateNodeStatusLocal(n.children, targetId, newStatus) };
      return n;
    });
  };

  const availablePaperIds = EXAM_BUNDLES.filter(b => enrolledBundleIds.includes(b.id)).flatMap(b => b.paperIds);

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-900 font-sans p-4 md:p-8 flex flex-col overflow-hidden h-screen relative">
      
      {/* --- WARNING MARQUEE --- */}
      <div className="absolute top-0 left-0 w-full bg-amber-400 overflow-hidden py-1 z-50 border-b-2 border-black">
         <div className="whitespace-nowrap animate-marquee flex gap-12 text-[10px] font-black text-black uppercase tracking-widest">
            <span>⚠️ WARNING: MAP IS A REPRESENTATION. THE TERRITORY IS VAST. VERIFY VECTOR COORDINATES WITH OFFICIAL UPSC/SSC COMMAND.</span>
            <span>⚠️ WE DENY LIABILITY FOR NAVIGATION ERRORS.</span>
            <span>⚠️ WARNING: MAP IS A REPRESENTATION. THE TERRITORY IS VAST. VERIFY VECTOR COORDINATES WITH OFFICIAL UPSC/SSC COMMAND.</span>
         </div>
      </div>

      <div className="mt-4 flex flex-col md:flex-row justify-between gap-4 mb-4 shrink-0 items-center">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <button onClick={() => router.push('/dashboard')} className="p-3 border-4 border-black hover:bg-black hover:text-white transition-colors">
            <ArrowLeft size={24} strokeWidth={3} />
          </button>
          
          <div className="relative flex-1 md:w-96 group">
            <input 
              placeholder="SEARCH ARCHIVES..." 
              className="w-full bg-white border-4 border-black p-3 pl-10 text-sm font-black font-mono uppercase focus:outline-none focus:shadow-[4px_4px_0_#000] transition-shadow placeholder:text-stone-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-3 top-3.5 text-black" size={18} strokeWidth={3}/>
            
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 w-full bg-white border-4 border-black mt-2 max-h-80 overflow-y-auto z-50 shadow-[8px_8px_0_#000]">
                {searchResults.map((res, i) => (
                  <button key={i} onClick={() => { handleNodeClick(res.node); setSearchQuery(""); }} className="w-full text-left p-3 border-b-2 border-stone-100 hover:bg-stone-100 flex flex-col gap-1">
                    <div className="flex justify-between w-full">
                        <span className="font-bold text-xs uppercase text-black">{res.node.title}</span>
                        <span className="text-[9px] bg-stone-200 px-1 text-stone-600 font-mono self-start">{res.node.status || 'LOCKED'}</span>
                    </div>
                    <div className="text-[10px] font-mono text-stone-400 truncate w-full">In: {res.path}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <select 
              className="w-full appearance-none bg-white border-4 border-black px-4 py-3 pr-10 font-black font-mono text-sm uppercase cursor-pointer focus:shadow-[4px_4px_0_#000] transition-shadow outline-none"
              value={selectedPaperId}
              onChange={(e) => setSelectedPaperId(e.target.value)}
            >
              {EXAM_REGISTRY.filter(paper => availablePaperIds.includes(paper.id)).map(paper => (
                  <option key={paper.id} value={paper.id}>{paper.title}</option>
              ))}
            </select>
            <ChevronDown size={20} className="absolute right-3 top-3.5 pointer-events-none text-black" strokeWidth={3}/>
          </div>
          <button onClick={() => setShowSelector(true)} className="p-3 bg-black text-white border-4 border-black hover:bg-stone-800 transition-colors" title="Add New Exam Path">
            <Plus size={24} strokeWidth={3} />
          </button>
        </div>
      </div>

      <div className="flex-1 bg-stone-50 border-4 border-black shadow-[8px_8px_0_#000] overflow-hidden relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-[#FDFBF7] z-20"><Loader2 className="animate-spin text-black" size={48} strokeWidth={3}/></div>
        ) : selectedPaperId ? (
          <SyllabusTechTree nodes={treeData} onNodeClick={handleNodeClick} />
        ) : (
          <div className="flex items-center justify-center h-full text-stone-400 font-black uppercase">Select an Exam Path to Begin</div>
        )}
      </div>

      <AnimatePresence>
        {plantModalNode && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-[#FDFBF7] border-4 border-black p-8 max-w-md w-full shadow-[12px_12px_0_#000] relative">
              <button onClick={() => setPlantModalNode(null)} className="absolute top-4 right-4 hover:bg-stone-200 p-1 rounded"><X size={24} strokeWidth={3}/></button>
              <h3 className="text-2xl font-black font-serif mb-2 uppercase leading-none">Catalog Specimen</h3>
              <p className="text-lg font-bold text-stone-600 mb-8 border-b-2 border-stone-200 pb-4">{plantModalNode.title}</p>
              <div className="space-y-3">
                <button onClick={() => handlePlantAction('active')} className="w-full py-4 bg-black text-white font-black uppercase tracking-widest hover:bg-stone-800 flex items-center justify-center gap-3 group">
                  <Sprout className="group-hover:animate-bounce" /> Start Studying
                </button>
                <div className="flex items-center py-2"><div className="flex-grow border-t-2 border-stone-300"></div><span className="mx-4 text-xs font-bold text-stone-400">OR</span><div className="flex-grow border-t-2 border-stone-300"></div></div>
                <button onClick={() => handlePlantAction('completed')} className="w-full py-4 bg-amber-400 text-black border-4 border-black font-black uppercase tracking-widest hover:bg-amber-300 flex items-center justify-center gap-3 shadow-[4px_4px_0_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1">
                  <Check strokeWidth={4} /> Mark as Complete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {drawerNode && (
          <SpecimenDrawer 
            node={drawerNode} onClose={() => setDrawerNode(null)} revertsLeft={revertsAvailable} 
            onRevert={handleRevert} onNuclearReset={handleNuclearReset} onCompost={handleCompost}
          />
        )}
      </AnimatePresence>

      {/* CUSTOM CONFIRMATION MODAL */}
      <AnimatePresence>
        {confirmState && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm">
             <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white border-4 border-black p-8 max-w-sm text-center shadow-[12px_12px_0_#000]">
                <Skull size={48} className="mx-auto text-black mb-4" />
                <h3 className="font-black text-xl mb-4 font-serif uppercase">Irreversible Action</h3>
                <p className="font-mono text-xs font-bold text-stone-500 mb-8">{confirmState.msg}</p>
                <div className="flex gap-4">
                   <button onClick={() => setConfirmState(null)} className="flex-1 py-3 border-2 border-black font-black text-xs uppercase hover:bg-stone-100">Cancel</button>
                   <button onClick={confirmState.action} className="flex-1 py-3 bg-red-600 text-white border-2 border-black font-black text-xs uppercase hover:bg-red-700 shadow-[4px_4px_0_#000]">Confirm</button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CUSTOM ALERT MODAL */}
      <AnimatePresence>
        {alertState.show && (
          <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60]">
            <div className={`px-6 py-3 border-2 shadow-[4px_4px_0_rgba(0,0,0,0.1)] flex items-center gap-3 font-mono text-xs font-bold uppercase tracking-wider
              ${alertState.type === 'error' ? 'bg-red-50 border-red-900 text-red-900' : 'bg-white border-black text-black'}`}>
              <div className={`w-2 h-2 rounded-full ${alertState.type === 'error' ? 'bg-red-600' : 'bg-black'} animate-pulse`}></div>
              {alertState.msg}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSelector && (
          <ExamSelector 
            enrolledBundleIds={enrolledBundleIds} userTier={userTier} onSelect={handleAddBundle}
            onClose={() => { if (enrolledBundleIds.length === 0) router.push('/'); else setShowSelector(false); }}
          />
        )}
      </AnimatePresence>

    </div>
  );
}