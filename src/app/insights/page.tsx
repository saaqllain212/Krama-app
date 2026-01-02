'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';

export default function InsightsPage() {
  const router = useRouter();

  // ✅ PATCH 2 — State & Supabase Client
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [percentages, setPercentages] = useState<number[]>([]);

  // ✅ PATCH 3 — Fetch + Derive Mock Percentages
  useEffect(() => {
    const fetchInsightsData = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('mock_entries')
        .select('score, max_score')
        .eq('user_id', userData.user.id)
        .order('taken_at', { ascending: true });

      if (!data || data.length === 0) {
        setPercentages([]);
        setLoading(false);
        return;
      }

      const pcts = data
        .map(m =>
          m.max_score && m.max_score > 0
            ? Math.round((m.score / m.max_score) * 100)
            : null
        )
        .filter((v): v is number => v !== null);

      setPercentages(pcts);
      setLoading(false);
    };

    fetchInsightsData();
  }, [supabase]);

  // ✅ PATCH 4 — Derived Metrics
  const average =
    percentages.length > 0
      ? Math.round(
          percentages.reduce((a, b) => a + b, 0) / percentages.length
        )
      : null;

  const best =
    percentages.length > 0 ? Math.max(...percentages) : null;

  const worst =
    percentages.length > 0 ? Math.min(...percentages) : null;

  // Trend (last 5)
  let trendLabel = '—';
  if (percentages.length >= 3) {
    const recent = percentages.slice(-5);
    const delta = recent[recent.length - 1] - recent[0];
    if (delta > 5) trendLabel = 'Improving';
    else if (delta < -5) trendLabel = 'Declining';
    else trendLabel = 'Stable';
  }

  // Phase
  let phase = 'Insufficient Data';
  if (percentages.length >= 5) {
    const recent = percentages.slice(-5);
    const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const spread = Math.max(...recent) - Math.min(...recent);

    if (avg < 50 || spread > 15) phase = 'Instability';
    else if (avg < 65) phase = 'Stability';
    else if (avg < 80) phase = 'Growth';
    else phase = 'Peak';
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-900 pt-24 px-4 md:px-8">
      
      {/* HEADER */}
      <header className="max-w-4xl mx-auto mb-12">

        {/* BACK BUTTON */}
        <button
          onClick={() => router.back()}
          className="mb-6 inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-stone-600 hover:text-black"
        >
          ← Back
        </button>

        <h1 className="text-4xl font-black font-serif tracking-tight mb-3">
          Insights
        </h1>

        <p className="text-sm font-mono text-stone-600 max-w-2xl">
          This layer converts historical activity into structured understanding.
          No actions occur here. Observation only.
        </p>

        {/* READ-ONLY NOTICE */}
        <div className="mt-4 border-2 border-dashed border-stone-300 bg-stone-50 px-4 py-3 text-xs font-mono text-stone-600">
        This page is <span className="font-black">read-only</span>.  
        Insights reflect patterns already formed elsewhere. No action is required here.
        </div>

      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-5xl mx-auto space-y-12">

        {/* SECTION 1 — PERFORMANCE */}
        <section className="border-4 border-black bg-white shadow-[8px_8px_0_#000] p-6">
          <h2 className="text-xl font-black uppercase mb-2">
            Performance Overview
          </h2>
          <p className="text-sm font-mono text-stone-600 mb-6">
            A consolidated view of performance derived from logged mocks.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="border-2 border-dashed border-stone-300 p-4 text-center">
              <div className="text-xs font-black uppercase text-stone-500 mb-1">
                Average
              </div>
              <div className="text-sm font-mono text-stone-400">
                {/* ✅ PATCH 5 REPLACEMENT */}
                {loading ? '—' : average !== null ? `${average}%` : '—'}
              </div>
            </div>

            <div className="border-2 border-dashed border-stone-300 p-4 text-center">
              <div className="text-xs font-black uppercase text-stone-500 mb-1">
                Best / Worst
              </div>
              <div className="text-sm font-mono text-stone-400">
                {/* ✅ PATCH 5 REPLACEMENT */}
                {loading ? '—' : best !== null && worst !== null ? `${best}% / ${worst}%` : '—'}
              </div>
            </div>

            <div className="border-2 border-dashed border-stone-300 p-4 text-center">
              <div className="text-xs font-black uppercase text-stone-500 mb-1">
                Trend
              </div>
              <div className="text-sm font-mono text-stone-400">
                {/* ✅ PATCH 5 REPLACEMENT */}
                {loading ? '—' : trendLabel}
              </div>
            </div>
          </div>

          <p className="mt-4 text-[11px] font-mono text-stone-400 italic">
            Derived from historical mock and study data.
          </p>

        </section>

        {/* SECTION 2 — PHASE */}
        <section className="border-4 border-black bg-white shadow-[8px_8px_0_#000] p-6">
          <h2 className="text-xl font-black uppercase mb-2">
            Phase Analysis
          </h2>
          <p className="text-sm font-mono text-stone-600 mb-6">
            Your current phase reflects consistency and recovery patterns
            observed in recent performance.
          </p>

          <div className="border-2 border-dashed border-stone-300 p-6 text-center">
            <div className="text-xs font-black uppercase text-stone-500 mb-2">
              Current Phase
            </div>
            <div className="text-lg font-black text-stone-400 mb-3">
              {/* ✅ PATCH 5 REPLACEMENT */}
              {loading ? '—' : phase}
            </div>
            <p className="text-sm font-mono text-stone-500 max-w-md mx-auto">
              Phases describe stability characteristics — not readiness,
              rank, or outcome.
            </p>
          </div>

          <p className="mt-4 text-[11px] font-mono text-stone-400 italic">
              Derived from historical mock and study data.
          </p>

        </section>

        {/* SECTION 3 — CONSISTENCY */}
        <section className="border-4 border-black bg-white shadow-[8px_8px_0_#000] p-6">
          <h2 className="text-xl font-black uppercase mb-2">
            Consistency Signals
          </h2>
          <p className="text-sm font-mono text-stone-600 mb-6">
            Behavioral signals extracted from regularity, volatility,
            and recovery.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="border-2 border-dashed border-stone-300 p-4 text-center">
              <div className="text-xs font-black uppercase text-stone-500 mb-1">
                Regularity
              </div>
              <div className="text-sm font-mono text-stone-400">
                Mock frequency patterns
              </div>
            </div>

            <div className="border-2 border-dashed border-stone-300 p-4 text-center">
              <div className="text-xs font-black uppercase text-stone-500 mb-1">
                Volatility
              </div>
              <div className="text-sm font-mono text-stone-400">
                Score fluctuation range
              </div>
            </div>

            <div className="border-2 border-dashed border-stone-300 p-4 text-center">
              <div className="text-xs font-black uppercase text-stone-500 mb-1">
                Recovery
              </div>
              <div className="text-sm font-mono text-stone-400">
                Bounce-back behavior
              </div>
            </div>
          </div>
          <p className="mt-4 text-[11px] font-mono text-stone-400 italic">
            Derived from historical mock and study data.
          </p>

        </section>

        {/* GUARDRAIL */}
        <section className="border-2 border-dashed border-stone-300 bg-stone-50 p-6 text-center">
          <p className="text-sm font-mono text-stone-600 max-w-2xl mx-auto">
            Insights are descriptive, not prescriptive.  
            They reflect what has occurred — not what you should do next.
          </p>
        </section>

        {/* FOOTER */}
        <footer className="pt-6 text-xs font-mono text-stone-500 italic text-center">
          Interpretation belongs to the scholar.  
          Action belongs in practice.
        </footer>

      </main>
    </div>
  );
}