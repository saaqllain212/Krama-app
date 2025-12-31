'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { Timer, X, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TargetClockProps {
  userId: string;
  initialTarget: string | null;
  onUpdate: (newDate: string) => void;
}

export default function TargetClock({ userId, initialTarget, onUpdate }: TargetClockProps) {
  const supabase = createClient();
  
  // Initialize state from props
  const [targetDate, setTargetDate] = useState<Date | null>(initialTarget ? new Date(initialTarget) : null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  // Edit State
  const [editDate, setEditDate] = useState('');
  const [saving, setSaving] = useState(false);

  // Sync state if initialTarget changes (e.g. after profile load)
  useEffect(() => {
    if (initialTarget) {
      setTargetDate(new Date(initialTarget));
    }
  }, [initialTarget]);

  // Ticker Logic
  useEffect(() => {
    if (!targetDate) {
      setSecondsLeft(0);
      return;
    }

    const tick = () => {
      const now = new Date();
      const diff = targetDate.getTime() - now.getTime();
      setSecondsLeft(Math.max(0, Math.floor(diff / 1000)));
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  // Helpers
  const formatSeconds = (secs: number) => new Intl.NumberFormat('en-US').format(secs);
  
  const getDaysHours = () => {
    if (!targetDate) return { days: 0, hours: 0 };
    const now = new Date();
    const diff = targetDate.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return { days, hours };
  };

  // Database Save
  const handleSave = async () => {
    if (!editDate || !userId) return;
    setSaving(true);

    const isoDate = new Date(editDate).toISOString();
    const { error } = await supabase
      .from('profiles')
      .update({ target_exam_date: isoDate })
      .eq('user_id', userId);

    if (!error) {
      setTargetDate(new Date(editDate));
      onUpdate(isoDate); 
      setShowModal(false);
    } else {
      alert('Failed to save date. Check console.');
      console.error(error);
    }
    setSaving(false);
  };

  const { days, hours } = getDaysHours();
  const isUrgent = days < 30;

  return (
    <>
      {/* --- THE WIDGET (Top Bar) --- */}
      <div 
        onClick={() => setShowModal(true)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="hidden md:flex items-center gap-3 bg-white px-5 py-2 border-2 border-stone-900 shadow-[3px_3px_0_#000] rounded-sm cursor-pointer hover:translate-y-1 hover:shadow-none transition-all group select-none"
      >
        <Timer 
          size={16} 
          className={`${secondsLeft > 0 ? 'text-stone-900 group-hover:animate-spin' : 'text-stone-400'}`} 
          strokeWidth={2.5} 
        />
        
        <div className="flex flex-col items-end leading-none min-w-[120px]">
          <span className="text-[9px] text-stone-500 font-black uppercase tracking-widest mb-0.5">
            {targetDate ? "Time Remaining" : "Set Objective"}
          </span>
          
          <span className={`text-sm font-mono font-bold tabular-nums ${isUrgent && targetDate ? 'text-red-700' : 'text-stone-900'}`}>
            {targetDate ? (
              isHovered ? `${days}d ${hours}h Left` : `${formatSeconds(secondsLeft)} s`
            ) : (
              "NO TARGET SET"
            )}
          </span>
        </div>
      </div>

      {/* --- THE POPUP MODAL --- */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4 cursor-default" onClick={() => setShowModal(false)}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#FDFBF7] border-4 border-stone-900 p-8 max-w-sm w-full shadow-[8px_8px_0_#000] relative"
            >
              <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-stone-400 hover:text-stone-900">
                <X size={24} strokeWidth={3} />
              </button>

              <div className="mb-6 text-center">
                <h3 className="font-serif text-2xl font-black text-stone-900 uppercase">Mission Clock</h3>
                <p className="font-mono text-xs font-bold text-stone-500 tracking-widest mt-1">
                  DEFINE YOUR D-DAY
                </p>
              </div>

              {/* Status Box */}
              {targetDate && (
                <div className="bg-stone-100 border-2 border-stone-300 p-4 mb-6 text-center">
                   <div className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2">Current Trajectory</div>
                   <div className="text-4xl font-mono font-bold text-stone-900 mb-1">{days}</div>
                   <div className="text-xs font-bold text-stone-500 uppercase">Days Remaining</div>
                   
                   <div className="mt-4 pt-4 border-t border-dashed border-stone-300 flex justify-center gap-4 text-xs font-mono font-bold text-stone-400">
                      <span>{formatSeconds(secondsLeft)} SECONDS</span>
                   </div>
                </div>
              )}

              {/* Input Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-stone-900 uppercase tracking-widest mb-2">
                    Set Target Date
                  </label>
                  <input 
                    type="date" 
                    className="w-full bg-white border-2 border-stone-300 p-3 font-mono font-bold text-sm focus:border-stone-900 focus:outline-none text-stone-900"
                    onChange={(e) => setEditDate(e.target.value)}
                  />
                </div>

                <button 
                  onClick={handleSave}
                  disabled={saving || !editDate}
                  className="w-full py-4 bg-stone-900 text-white font-black uppercase tracking-[0.2em] text-xs hover:bg-emerald-900 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-[4px_4px_0_#14532d]"
                >
                  {saving ? "CALIBRATING..." : "CONFIRM VECTOR"} <Save size={16} />
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}