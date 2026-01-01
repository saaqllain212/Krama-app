'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Lock, Plus, Layers, AlertTriangle, ShieldAlert, Server, X, LogOut } from 'lucide-react';
import { EXAM_BUNDLES } from '@/lib/examRegistry';

interface SelectorProps {
  enrolledBundleIds: string[];
  userTier: 'free' | 'pro';
  onSelect: (bundleId: string) => void;
  onClose: () => void;
}

export default function ExamSelector({ enrolledBundleIds, userTier, onSelect, onClose }: SelectorProps) {
  const [selectedBundleId, setSelectedBundleId] = useState<string | null>(null);

  const limit = userTier === 'pro' ? 2 : 1;
  const currentCount = enrolledBundleIds.length;
  const isSlotAvailable = currentCount < limit;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-[#FDFBF7] border-4 border-black w-full max-w-5xl max-h-[90vh] flex flex-col shadow-[12px_12px_0_#292524]"
      >
        {/* Header */}
        <div className="p-8 border-b-4 border-black bg-stone-100 flex justify-between items-start">
          <div>
              <h2 className="text-3xl font-black font-serif text-black uppercase tracking-wider mb-2">
                {currentCount === 0 ? "Initialize Protocol" : "Expand Arsenal"}
              </h2>
              <p className="text-sm font-bold font-mono text-stone-500">
                TIER: <span className="text-black bg-amber-300 px-1">{userTier.toUpperCase()}</span> 
                {' • '} 
                SLOTS: {currentCount}/{limit}
              </p>
              {currentCount === 0 && (
                <p className="mt-2 text-xs font-mono text-stone-400 italic max-w-md">
                  You can skip this for now.  
                  <span className="text-stone-600 font-bold"> The garden won’t collapse.</span>
                </p>
              )}
          </div>
          
          {/* --- THE WITTY CANCEL BUTTON --- */}
          <button 
            onClick={onClose} 
            className="group flex items-center gap-2 text-xs font-black uppercase tracking-widest text-stone-400 hover:text-red-600 transition-colors mt-1"
          >
            {currentCount === 0 ? (
              <span className="flex flex-col items-end">
                <span className="group-hover:hidden">ABORT PROTOCOL</span>
                <span className="hidden group-hover:inline text-red-600">RETREAT TO SAFETY</span>
              </span>
            ) : (
              "CANCEL"
            )}
            <X size={20} strokeWidth={3} />
          </button>
        </div>

        {/* LIMIT REACHED WARNING */}
        {!isSlotAvailable && (
          <div className="bg-red-100 border-b-4 border-black p-4 flex gap-3 items-center justify-center text-red-900">
             <ShieldAlert size={20} />
             <span className="font-bold font-mono text-xs uppercase tracking-widest text-center">
                {userTier === 'free'
                  ? "FREE TIER LIMIT: 1 EXAM. UPGRADE TO PRO."
                  : "PRO LIMIT: 2 EXAMS ONLY. FINISH ONE BEFORE STARTING ANOTHER."}
              </span>

          </div>
        )}

        {/* NEW USER ADVISORY */}
        {currentCount === 0 && (
          <div className="bg-amber-50 border-b-4 border-black p-6 flex gap-4 items-start text-amber-900">
             <div className="bg-amber-200 p-2 rounded-full border-2 border-amber-900 shrink-0 mt-1">
                <Server size={20} strokeWidth={2.5} />
             </div>
             <div>
                <h4 className="font-black text-sm uppercase tracking-widest mb-2 flex items-center gap-2">
                  Resource Limit Advisory
                </h4>
                <p className="font-mono text-[11px] font-bold leading-relaxed opacity-80 max-w-2xl">
                  Due to the high computational cost of maintaining the neural map and backend servers, Free Tier access is strictly limited to <span className="bg-amber-200 px-1 text-black border border-amber-900 mx-1">1 EXAM PATH</span>.
                  <br/><br/>
                  We cannot subsidize server load for multiple paths on the free plan. Please choose your primary target carefully.
                  <span className="block mt-3 text-amber-800 border-l-2 border-amber-500 pl-2">
                    Need more? Upgrade to <strong>SCHOLAR (Pro)</strong> to unlock a second slot.
                  </span>
                </p>
             </div>
          </div>
        )}

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {EXAM_BUNDLES.map((bundle) => {
            const isOwned = enrolledBundleIds.includes(bundle.id);
            const isSelected = selectedBundleId === bundle.id;

            return (
              <button
                key={bundle.id}
                disabled={isOwned || (!isSlotAvailable && !isOwned)}
                onClick={() => setSelectedBundleId(bundle.id)}
                className={`relative p-6 border-4 text-left transition-all group flex flex-col h-full
                  ${isOwned 
                    ? 'bg-stone-200 border-stone-300 cursor-not-allowed opacity-60' 
                    : !isSlotAvailable 
                      ? 'bg-stone-100 border-stone-200 cursor-not-allowed grayscale'
                      : isSelected 
                        ? 'bg-black border-black text-white shadow-[8px_8px_0_#d6d3d1] -translate-y-1' 
                        : 'bg-white border-black text-black hover:bg-stone-50'
                  }
                `}
              >
                {isOwned && (
                  <div className="absolute top-2 right-2 text-stone-500 font-black text-[10px] uppercase flex items-center gap-1">
                    <CheckCircle2 size={12} /> Active
                  </div>
                )}
                
                <h3 className="font-black font-serif text-2xl leading-tight mb-2">{bundle.title}</h3>
                <p className={`text-xs font-bold mb-6 flex-1 ${isSelected ? 'text-stone-300' : 'text-stone-500'}`}>
                  {bundle.description}
                </p>

                <div className={`text-[10px] font-mono font-black uppercase tracking-widest border-t-2 pt-3 flex items-center gap-2
                   ${isSelected ? 'border-stone-700 text-stone-400' : 'border-stone-200 text-stone-400'}
                `}>
                  <Layers size={12} /> {bundle.paperIds.length} Papers
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-6 border-t-4 border-black bg-stone-100 flex justify-between items-center">
          <div className="text-sm font-bold text-stone-600">
            {isSlotAvailable ? (
              <span className="flex items-center gap-2 text-emerald-700"><Plus size={16} /> Slot Available</span>
            ) : (
              <span className="flex items-center gap-2 text-red-600"><Lock size={16} /> Limit Reached</span>
            )}
          </div>

          <button 
            disabled={!selectedBundleId || !isSlotAvailable}
            onClick={() => selectedBundleId && onSelect(selectedBundleId)}
            className="px-8 py-4 bg-black text-white font-black uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed hover:bg-stone-800 transition-all shadow-[4px_4px_0_rgba(0,0,0,0.2)] hover:translate-y-1 hover:shadow-none"
          >
            Confirm Selection
          </button>
        </div>

      </motion.div>
    </div>
  );
}