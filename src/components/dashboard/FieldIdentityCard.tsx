'use client';
import { motion } from 'framer-motion';
import { User, Fingerprint, Shield, LogOut } from 'lucide-react';

interface FieldIdentityCardProps {
  isOpen: boolean;
  onClose: () => void;
  profile: any;
  user: any;
  onLogout: () => void;
}

export default function FieldIdentityCard({ isOpen, onClose, profile, user, onLogout }: FieldIdentityCardProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4" onClick={onClose}>
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
        <motion.div 
          initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
          className="bg-[#FDFBF7] border-4 border-black p-8 max-w-md w-full relative shadow-[12px_12px_0_#000]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="absolute top-0 right-0 bg-black text-white px-4 py-1 text-xs font-black uppercase tracking-widest">FIELD IDENTITY CARD</div>
          <div className="mt-6 flex gap-6 items-start">
              <div className="w-24 h-24 border-4 border-black bg-stone-200 shrink-0 overflow-hidden flex items-center justify-center">
                <User size={48} className="text-stone-400" />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-mono text-stone-500 uppercase tracking-widest font-black">Name</div>
                <div className="text-2xl font-serif font-black text-black leading-none uppercase">{profile?.name}</div>
                
                <div className="text-xs font-mono text-stone-500 uppercase tracking-widest font-black mt-3">Email</div>
                <div className="text-sm font-bold text-black">{user?.email}</div>

                <div className="flex gap-2 mt-4">
                  <div className="bg-black text-white px-2 py-1 text-xs font-black uppercase tracking-widest border border-black">TIER: {profile?.is_admin ? 'ADMIN' : profile?.tier?.toUpperCase()}</div>
                  <div className="bg-emerald-100 text-emerald-900 px-2 py-1 text-xs font-black uppercase tracking-widest border border-emerald-900 flex items-center gap-1"><Shield size={10} /> {profile?.tier === 'pro' ? 'UNRESTRICTED' : 'LIMITED'}</div>
                </div>
              </div>
          </div>
          <div className="mt-8 pt-6 border-t-2 border-dashed border-stone-300 flex justify-between items-end">
              <div>
                <div className="text-xs font-black text-stone-400 uppercase tracking-widest">Scholar Since</div>
                <div className="font-mono text-xs font-bold text-black">{new Date(profile?.created_at).toLocaleDateString()}</div>
              </div>
              <Fingerprint size={48} className="text-stone-200" />
          </div>
          <div className="mt-6">
            <button onClick={onLogout} className="w-full py-3 border-2 border-red-900 text-red-900 font-black uppercase text-xs hover:bg-red-50 transition-colors flex items-center justify-center gap-2"><LogOut size={16}/> Resign Commission (Log Out)</button>
          </div>
        </motion.div>
    </div>
  );
}