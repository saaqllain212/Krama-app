'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Sparkles, ShieldCheck, Loader2, X, AlertTriangle } from 'lucide-react';
import { createClient } from '@/lib/supabase';

interface ProUpgradeModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type ModalState = 'OFFER' | 'PROCESSING' | 'SUCCESS' | 'ERROR';

const FUNCTIONS_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL + '/functions/v1';

export default function ProUpgradeModal({ open, onClose, onSuccess }: ProUpgradeModalProps) {
  const supabase = createClient();
  const [view, setView] = useState<ModalState>('OFFER');
  const [errorMessage, setErrorMessage] = useState('');
  const [coupon, setCoupon] = useState('');

  // Reset state when opening
  useEffect(() => {
    if (open) setView('OFFER');
  }, [open]);

  // Load Razorpay script (safe, single load)
  useEffect(() => {
    if (!open) return;
    if (document.getElementById('razorpay-sdk')) return;

    const script = document.createElement('script');
    script.id = 'razorpay-sdk';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
  }, [open]);

  const handlePayment = async () => {
    try {
      setErrorMessage('');
      setView('PROCESSING');

      // 1️⃣ Get logged-in user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Session expired. Please log in again.');

      // ✅ FIX: Get session access token (REQUIRED for Edge Functions)
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Session expired. Please log in again.');

      // 2️⃣ Create Razorpay order (Supabase Edge)
      const orderRes = await fetch(
        `${FUNCTIONS_URL}/create-order`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`, // ✅ FIXED
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: 399,
            coupon: coupon || null,
          }),
        }
      );

      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        throw new Error(orderData.error || 'Failed to create order');
      }

      // 3️⃣ Razorpay Checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'MINDSPAN',
        description: 'Clearance Level: Pro',
        order_id: orderData.id,
        prefill: { email: user.email },
        theme: { color: '#000000' },

        handler: async (response: any) => {
          try {
            // 4️⃣ Verify payment (Supabase Edge)
            const verifyRes = await fetch(
              `${FUNCTIONS_URL}/verify-payment`,
              {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${session.access_token}`, // ✅ FIXED
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  razorpay_order_id: orderData.id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  user_id: user.id,
                }),
              }
            );

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) {
              throw new Error(verifyData.error || 'Payment verification failed');
            }

            // 🎉 VERIFIED
            setView('SUCCESS');
            onSuccess();

            setTimeout(() => {
              onClose();
            }, 3000);
          } catch (err: any) {
            setErrorMessage(err.message || 'Verification error');
            setView('ERROR');
          }
        },
      };

      // @ts-ignore
      const rzp = new window.Razorpay(options);

      rzp.on('payment.failed', (response: any) => {
        setErrorMessage(response.error?.description || 'Payment failed');
        setView('ERROR');
      });

      rzp.open();
    } catch (err: any) {
      setErrorMessage(err.message || 'Something went wrong');
      setView('ERROR');
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[800] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 10 }}
            onClick={(e) => e.stopPropagation()}
            className="relative bg-[#FDFBF7] border-4 border-black w-full max-w-md shadow-[16px_16px_0_#000] overflow-hidden"
          >
            <button onClick={onClose} className="absolute top-4 right-4 text-stone-400 hover:text-black">
              <X size={24} />
            </button>

            {view === 'OFFER' && (
              <div className="p-8">
                <div className="text-center mb-6">
                  <div className="mx-auto w-16 h-16 bg-black text-yellow-400 flex items-center justify-center mb-4 border-2 border-black">
                    <Crown size={32} />
                  </div>
                  <h2 className="font-black text-3xl uppercase tracking-tighter">Ascend.</h2>
                  <p className="text-sm font-serif italic text-stone-600 mt-2">
                    "Why remain a distinct specimen when you can be the architect?"
                  </p>
                </div>

                <div className="bg-stone-100 p-4 border-l-4 border-black mb-6">
                  <div className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-1">
                    Clearance Grant
                  </div>
                  <div className="flex items-center gap-2 font-black text-lg">
                    <Sparkles size={18} className="text-emerald-600" /> PRO SCHOLAR
                  </div>
                </div>

                <div className="text-center mb-6">
                  <div className="text-5xl font-black text-stone-900">₹399</div>
                  <div className="text-xs font-mono text-stone-500 mt-1 uppercase tracking-widest">
                    Lifetime Access
                  </div>
                </div>

                <div className="mb-6 bg-red-50 border-2 border-dashed border-red-200 p-3">
                  <div className="flex items-center gap-2 text-red-600 font-black text-xs uppercase tracking-widest mb-1">
                    <AlertTriangle size={12} /> Strict Limit: 2 Paths
                  </div>
                  <p className="text-[10px] font-mono font-bold text-red-800/80 leading-relaxed">
                    "Do not be a hoarder. These are exams, not Pokémon."
                  </p>
                </div>

                <input
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                  placeholder="HAVE A CODE?"
                  className="w-full mb-4 bg-transparent border-b-2 border-stone-300 p-2 text-center font-mono font-bold focus:border-black outline-none"
                />

                <button
                  onClick={handlePayment}
                  className="w-full py-4 bg-black text-yellow-400 font-black uppercase tracking-widest hover:bg-stone-900 transition-transform active:scale-95"
                >
                  Pay & Upgrade
                </button>
              </div>
            )}

            {view === 'PROCESSING' && (
              <div className="p-12 text-center h-96 flex flex-col items-center justify-center">
                <Loader2 size={48} className="animate-spin text-stone-400 mb-6" />
                <h3 className="font-black text-xl uppercase animate-pulse">
                  Summoning Gatekeeper...
                </h3>
                <p className="text-xs font-mono text-stone-500 mt-2">
                  Do not close this window.
                </p>
              </div>
            )}

            {view === 'SUCCESS' && (
              <div className="p-12 text-center bg-black text-[#FDFBF7] min-h-[400px] flex flex-col items-center justify-center">
                <div className="w-20 h-20 bg-yellow-400 text-black rounded-full flex items-center justify-center mb-6 border-4 border-[#FDFBF7]">
                  <ShieldCheck size={40} />
                </div>
                <h2 className="font-black text-3xl uppercase tracking-widest mb-4">
                  Access Granted.
                </h2>
                <p className="font-serif italic text-lg text-stone-400 mb-8 max-w-[260px]">
                  "The Gatekeeper steps aside."
                </p>
                <div className="text-xs font-mono text-yellow-400/50 animate-pulse">
                  RELOADING PROTOCOLS...
                </div>
              </div>
            )}

            {view === 'ERROR' && (
              <div className="p-8 text-center">
                <div className="text-red-500 mb-4 flex justify-center">
                  <X size={48} />
                </div>
                <h3 className="font-black text-xl uppercase">Transaction Denied</h3>
                <p className="font-mono text-xs text-red-600 bg-red-50 p-3 mt-4 border border-red-200">
                  {errorMessage || 'Unknown error occurred.'}
                </p>
                <button
                  onClick={() => setView('OFFER')}
                  className="mt-6 w-full py-3 border-2 border-black font-bold hover:bg-black hover:text-white"
                >
                  Try Again
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
