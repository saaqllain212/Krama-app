'use client';

import { Grid, Shield } from 'lucide-react';
import { Topic } from '@/lib/logic';

export default function ActivityHeatmap({
  topics,
  isUnlocked,
}: {
  topics: Topic[];
  isUnlocked: boolean;
}) {
  // Generate last 365 days
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
    <div className="mt-8 bg-white border-2 border-stone-900 p-6 shadow-[6px_6px_0_#e7e5e4] relative overflow-hidden mb-8"
         style={{ borderRadius: '15px 255px 15px 255px / 255px 15px 225px 15px' }}>
      
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-serif text-lg font-black text-stone-900 flex items-center gap-2">
          <Grid size={18}/> Longitudinal Activity
        </h3>
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-stone-400">
          <span>DORMANT</span>
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-stone-200"></div>
            <div className="w-2 h-2 bg-emerald-200"></div>
            <div className="w-2 h-2 bg-emerald-400"></div>
            <div className="w-2 h-2 bg-emerald-600"></div>
            <div className="w-2 h-2 bg-emerald-900"></div>
          </div>
          <span>ACTIVE</span>
        </div>
      </div>

      <div className="relative">
        <div className={`grid grid-rows-7 grid-flow-col gap-1 overflow-x-auto pb-2 ${!isUnlocked? 'blur-sm opacity-50 select-none pointer-events-none' : ''}`}>
           {data.map((day, i) => (
             <div 
               key={i} 
               className={`w-2 h-2 md:w-3 md:h-3 rounded-sm ${getColor(day.count)}`}
               title={isUnlocked ? `${day.date.toLocaleDateString()}: ${day.count} specimens` : ''}
             ></div>
           ))}
        </div>

        {!isUnlocked && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
             <div className="bg-stone-900/90 text-white p-4 border-2 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)] text-center max-w-xs transform -rotate-1">
                <Shield size={24} className="mx-auto text-emerald-400 mb-2" />
                <h4 className="font-black uppercase tracking-widest text-xs mb-1 text-emerald-400">Classified Data</h4>
                <p className="font-serif text-stone-300 text-xs italic mb-3">Longitudinal analysis is restricted to Pro Scholars.</p>
                <div className="text-xs font-mono font-bold bg-emerald-900 text-emerald-100 py-1 px-2 uppercase">Upgrade to Decode</div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};