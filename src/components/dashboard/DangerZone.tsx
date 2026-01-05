'use client';
import { Trash2, RefreshCcw, Crown, Shield } from 'lucide-react';

interface DangerZoneProps {
  onDeleteAccount: () => void;
  onResetData: () => void;
  onUnlockPro: () => void;
  isPro: boolean;
}

export default function DangerZone({ onDeleteAccount, onResetData, onUnlockPro, isPro }: DangerZoneProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        {/* DELETE ACCOUNT */}
        <button 
          onClick={onDeleteAccount}
          className="flex flex-col items-center justify-center p-6 border-2 border-stone-300 text-stone-400 hover:border-red-900 hover:text-red-900 hover:bg-red-50 transition-all group"
        >
          <Trash2 size={24} className="mb-2 group-hover:animate-bounce" />
          <span className="text-xs font-black uppercase tracking-widest">Delete Existence</span>
        </button>

        {/* RESET DATA */}
        <button 
          onClick={onResetData}
          className="flex flex-col items-center justify-center p-6 border-2 border-stone-300 text-stone-400 hover:border-orange-600 hover:text-orange-600 hover:bg-orange-50 transition-all group"
        >
          <RefreshCcw size={24} className="mb-2 group-hover:rotate-180 transition-transform duration-500" />
          <span className="text-xs font-black uppercase tracking-widest">Wipe Memory (Reset)</span>
        </button>

        {/* UNLOCK PRO (Only if Free) */}
        {!isPro ? (
          <button 
            onClick={onUnlockPro}
            className="flex flex-col items-center justify-center p-6 border-4 border-stone-900 bg-stone-900 text-white hover:bg-stone-800 hover:scale-[1.02] transition-all shadow-[8px_8px_0_#d97706]"
          >
            <Crown size={24} className="mb-2 text-yellow-400" />
            <span className="text-xs font-black uppercase tracking-widest text-yellow-100">Unlock Potential</span>
          </button>
        ) : (
          <div className="flex flex-col items-center justify-center p-6 border-2 border-emerald-900 bg-emerald-50 text-emerald-900 opacity-80 cursor-default">
            <Shield size={24} className="mb-2" />
            <span className="text-xs font-black uppercase tracking-widest">Pro Status Active</span>
          </div>
        )}
    </div>
  );
}