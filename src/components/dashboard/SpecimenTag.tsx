'use client';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { Topic } from '@/lib/logic';

interface SpecimenTagProps {
  topic: Topic;
  onWater: (topic: Topic) => void;
  onCompost: (id: string) => void;
}

export default function SpecimenTag({ topic, onWater, onCompost }: SpecimenTagProps) {
  return (
    <div className="relative bg-white border-2 border-stone-800 p-4 mb-3 shadow-[4px_4px_0_0_#1c1917] hover:-translate-y-1 transition-transform group rounded-sm">
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-4 bg-stone-200 rounded-full border-2 border-stone-800 z-10"></div>
      
      <div className="flex justify-between items-start mb-2 mt-2">
        <span className="font-mono text-xs text-stone-700 uppercase tracking-tight border border-stone-800 px-1 font-bold">{topic.category.toUpperCase()}</span>
        <div className="flex items-center gap-1 font-mono text-xs font-black text-red-900 bg-red-100 px-2 py-0.5 border border-red-900">
          <AlertTriangle size={12} strokeWidth={3} />
          OVERDUE
        </div>
      </div>
      
      <h4 className="font-serif text-lg font-black text-stone-900 leading-tight mb-4 line-clamp-2">
        {topic.title}
      </h4>
      
      <div className="flex gap-2">
        <button 
          onClick={() => onWater(topic)}
          className="flex-1 bg-stone-900 text-stone-50 py-2 text-xs font-black uppercase tracking-widest hover:bg-emerald-900 transition-colors shadow-sm"
        >
          Study Specimen
        </button>
        <button 
          onClick={() => onCompost(topic.id)}
          className="px-3 border-2 border-stone-300 text-stone-400 hover:text-red-600 hover:border-red-600 transition-colors"
        >
          <Trash2 size={16} strokeWidth={2.5}/>
        </button>
      </div>
    </div>
  );
}