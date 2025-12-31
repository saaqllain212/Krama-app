'use client';

import { motion } from 'framer-motion';
import { X, Calendar, Star, ShieldCheck, RotateCcw, Skull, Trash2 } from 'lucide-react';
import { SyllabusNode } from '@/lib/syllabusLogic';

interface DrawerProps {
  node: SyllabusNode | null;
  onClose: () => void;
  revertsLeft: number;
  onRevert: () => void;
  onNuclearReset: () => void;
  onCompost: () => void; // New: To delete "Growing" items
}

export default function SpecimenDrawer({ node, onClose, revertsLeft, onRevert, onNuclearReset, onCompost }: DrawerProps) {
  if (!node) return null;

  const isHarvested = node.status === 'harvested';
  
  // Date Formatting
  const dateStr = node.metadata?.planted_at 
    ? new Date(node.metadata.planted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Unknown';

  // Rarity Stars Logic
  const starCount = (node.title.length % 3) + 3;

  return (
    <>
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[50]"
      />

      <motion.div 
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed top-0 right-0 h-full w-full md:w-[450px] bg-[#FDFBF7] border-l-4 border-black shadow-[-20px_0_50px_rgba(0,0,0,0.5)] z-[60] p-8 flex flex-col overflow-y-auto"
      >
        <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-stone-200 rounded-full transition-colors border-2 border-transparent hover:border-black">
          <X size={24} strokeWidth={3} className="text-black" />
        </button>

        {/* Header */}
        <div className="mt-12 mb-6">
          <div className="flex items-center gap-2 mb-2">
             <div className={`px-2 py-0.5 text-white text-[10px] font-black uppercase tracking-widest rounded-sm ${isHarvested ? 'bg-amber-600' : 'bg-emerald-700'}`}>
               {isHarvested ? 'ARCHIVED' : 'ACTIVE SAMPLE'}
             </div>
             <div className="text-[10px] font-mono font-bold text-stone-400">
               #{node.id.split('_').pop()?.slice(0, 6).toUpperCase()}
             </div>
          </div>
          <h2 className="font-serif text-3xl font-black text-black leading-tight border-b-4 border-black pb-6">
            {node.title}
          </h2>
        </div>

        {/* Field Report Stats */}
        <div className="bg-white border-4 border-stone-200 p-6 shadow-sm mb-8">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-2 text-stone-400 mb-1">
                <Calendar size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">Date Planted</span>
              </div>
              <div className="text-xl font-serif font-bold text-black">{dateStr}</div>
            </div>
            <div>
              <div className="flex items-center gap-2 text-stone-400 mb-1">
                <ShieldCheck size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">Rarity</span>
              </div>
              <div className="flex text-black">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} fill={i < starCount ? "black" : "transparent"} strokeWidth={3} className={i < starCount ? "text-black" : "text-stone-200"} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* --- CONTROLS --- */}
        <div className="flex flex-col gap-4 p-8 bg-stone-50 border-2 border-dashed border-stone-300 rounded-lg">
           <div className="text-center">
             <div className={`inline-block border-4 px-6 py-2 font-black text-2xl uppercase tracking-widest transform -rotate-3 mb-2
               ${isHarvested ? 'border-amber-500 text-amber-600' : 'border-emerald-600 text-emerald-700'}
             `}>
               {isHarvested ? 'MASTERED' : 'GROWING'}
             </div>
           </div>

           {/* IF MASTERED: SHOW REVERT OPTIONS */}
           {isHarvested && (
             <div className="mt-4 pt-4 border-t-2 border-stone-200">
               {revertsLeft > 0 ? (
                 <button 
                   onClick={onRevert}
                   className="w-full flex items-center justify-center gap-2 text-stone-500 hover:text-black font-bold text-xs uppercase tracking-widest group transition-colors"
                 >
                   <RotateCcw size={14} className="group-hover:-rotate-180 transition-transform duration-500"/>
                   Revert Decision ({revertsLeft} Left)
                 </button>
               ) : (
                 <div className="text-center space-y-3">
                   <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">
                     ⚠️ No Reverts Remaining
                   </p>
                   <button 
                     onClick={onNuclearReset}
                     className="w-full py-3 bg-red-600 text-white font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-700 shadow-md"
                   >
                     <Skull size={16} /> RESET ENTIRE GARDEN
                   </button>
                   <p className="text-[9px] text-stone-400 font-mono">
                     Complete 50 topics to earn more reverts.
                   </p>
                 </div>
               )}
             </div>
           )}

           {/* IF GROWING: SHOW COMPOST (DELETE) OPTION */}
           {!isHarvested && (
             <div className="mt-4 pt-4 border-t-2 border-stone-200 text-center">
                <button 
                   onClick={onCompost}
                   className="flex items-center justify-center gap-2 text-stone-400 hover:text-red-600 font-bold text-[10px] uppercase tracking-widest transition-colors mx-auto"
                 >
                   <Trash2 size={12} /> Compost (Delete)
                 </button>
             </div>
           )}
        </div>

        <div className="mt-auto text-center pt-8">
          <p className="text-[10px] font-mono font-bold text-stone-300 uppercase">
            Krama Field System v16.0
          </p>
        </div>

      </motion.div>
    </>
  );
}