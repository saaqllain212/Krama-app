'use client';

import { useState, useEffect, Fragment } from 'react';
import { createClient } from '@/lib/supabase';
import { setMocksInsightsSnapshot } from '@/lib/mocksInsightsStore';


const MOCK_HISTORY_CACHE_KEY = 'krama_mock_history_v1';
const FIRST_TIME_MOCK_WARNING_KEY = 'krama_mock_warning_seen';

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function MocksModal({ open, onClose }: Props) {
  const supabase = createClient();

  // --- FORM STATE ---
  const [examName, setExamName] = useState('');
  const [score, setScore] = useState('');
  const [maxScore, setMaxScore] = useState('');
  const [accuracy, setAccuracy] = useState('');
  const [stress, setStress] = useState('');
  const [fatigue, setFatigue] = useState('');
  const [timeOfDay, setTimeOfDay] = useState('');
  const [note, setNote] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- HISTORY STATE ---
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyLimit, setHistoryLimit] = useState(20);

  // === SUMMARY STRIP DERIVED METRICS (READ-ONLY) ===
  const summary = (() => {
    if (!history || history.length === 0) {
      return {
        total: 0,
        average: null,
        best: null,
        worst: null,
        trend: null,
        phase: null,
      };
    }

    // history is DESC (Newest First)
    const percentages = history
      .map((h) => {
        const score = Number(h.score);
        const max = Number(h.max_score);

        if (
          Number.isNaN(score) ||
          Number.isNaN(max) ||
          max <= 0
        ) {
          return null;
        }

        return Math.round((score / max) * 100);
      })
      .filter((p): p is number => p !== null);

    if (percentages.length === 0) {
      return {
        total: history.length,
        average: null,
        best: null,
        worst: null,
        trend: null,
        phase: null,
      };
    }

    const total = history.length;
    
    // Global Stats (Lifetime)
    const sum = percentages.reduce((a, b) => a + b, 0);
    const average = Math.round(sum / percentages.length);
    const best = Math.max(...percentages);
    const worst = Math.min(...percentages);

    // === TREND LOGIC (LAST 10 MOCKS) ===
    const recent = percentages.slice(0, 10); 
    let trend: 'up' | 'down' | 'stable' | null = null;
    
    if (recent.length >= 2) {
      const mid = Math.floor(recent.length / 2);
      // recent is Newest -> Oldest
      // firstHalf is Older, secondHalf is Newer (in terms of array index, wait: slice(0,mid) is NEWER)
      const newerHalf = recent.slice(0, mid); 
      const olderHalf = recent.slice(mid);

      const avg = (arr: number[]) =>
        arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

      const olderAvg = avg(olderHalf);
      const newerAvg = avg(newerHalf);

      const diff = newerAvg - olderAvg;

      if (diff > 2) trend = 'up';
      else if (diff < -2) trend = 'down';
      else trend = 'stable';
    }

    // === PHASE DERIVATION (ROLLING WINDOW LOGIC) ===
    // We only look at the last 5 mocks for Phase to allow "recovery" from bad starts
    const phaseWindow = percentages.slice(0, 5); // 0-5 is the 5 most recent entries
    const windowAvg = phaseWindow.reduce((a, b) => a + b, 0) / phaseWindow.length;
    const windowWorst = Math.min(...phaseWindow);

    let phase: 'Instability' | 'Stability' | 'Growth' | 'Peak' = 'Instability';
    
    if (phaseWindow.length < 3) {
      phase = 'Instability';
    } else if (
      windowAvg >= 80 &&
      windowWorst >= 70
    ) {
      phase = 'Peak';
    } else if (
      (windowAvg >= 65 && windowWorst >= 50) || 
      (windowAvg >= 55 && trend === 'up') // Flexible growth if trending up strongly
    ) {
      phase = 'Growth';
    } else if (
      windowAvg >= 50 &&
      trend !== 'down'
    ) {
      phase = 'Stability';
    } else {
      phase = 'Instability';
    }

    

    return {
      total,
      average,
      best,
      worst,
      trend,
      phase,
    };
  })();

  // === EXAM NAME CONSISTENCY CHECK ===
  const hasMixedExams = (() => {
    if (!history || history.length < 3) return false;

    const normalized = history
      .map((h) => (h.exam_name || '').trim().toLowerCase())
      .filter(Boolean);

    const unique = new Set(normalized);
    return unique.size > 1;
  })();

  // === PHASE HISTORY (OVER TIME) ===
  const phaseHistory = (() => {
    if (!history || history.length === 0) return [];

    // Use same exam as most recent mock (loose match)
    const currentExam =
      (history[0]?.exam_name || '').trim().toLowerCase();

    const relevant = history.filter(
      (h) =>
        (h.exam_name || '').trim().toLowerCase() === currentExam
    );

    // Oldest → Newest for the graph generation
    const chronological = [...relevant].reverse();

    const phases: {
      date: string;
      phase: 'Instability' | 'Stability' | 'Growth' | 'Peak';
    }[] = [];

    const percentages: number[] = [];

    for (const m of chronological) {
      const score = Number(m.score);
      const max = Number(m.max_score);

      if (Number.isNaN(score) || Number.isNaN(max) || max <= 0) {
        continue;
      }

      const pct = Math.round((score / max) * 100);
      percentages.push(pct);

      // ---- Derive phase using ROLLING WINDOW ----
      let phase: 'Instability' | 'Stability' | 'Growth' | 'Peak' = 'Instability';

      if (percentages.length < 3) {
        phase = 'Instability';
      } else {
        
        // 1. Define Window (Last 5 exams only)
        // This ensures the 48 from exam #1 drops off when calculating exam #6's phase
        const windowSize = 5;
        const currentWindow = percentages.slice(-windowSize);

        // 2. Metrics on Window
        const winAvg = currentWindow.reduce((a,b)=>a+b,0)/currentWindow.length;
        const winWorst = Math.min(...currentWindow);

        // 3. Local Trend Calculation for this point in time
        let localTrend: 'up' | 'down' | 'stable' = 'stable';
        // Trend only makes sense with enough data
        if (currentWindow.length >= 4) {

           // split window in half
           const split = Math.floor(currentWindow.length/2);
           const early = currentWindow.slice(0, split);
           const late = currentWindow.slice(split);
           const avg = (arr:number[]) => arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0;
           
           if (avg(late) - avg(early) > 2) localTrend = 'up';
           else if (avg(late) - avg(early) < -2) localTrend = 'down';
        }

        // 4. Apply Logic
        if (winAvg >= 80 && winWorst >= 70) {
            phase = 'Peak';
        } else if (
            (winAvg >= 65 && winWorst >= 50) || 
            (winAvg >= 55 && localTrend === 'up')
        ) {
            phase = 'Growth';
        } else if (winAvg >= 50 && localTrend !== 'down') {
            phase = 'Stability';
        } else {
            phase = 'Instability';
        }
      }

      phases.push({
        date: m.taken_at,
        phase,
      });
    }

    return phases;
  })();

  // --- UI STATE ---
  const [expandedMockId, setExpandedMockId] = useState<string | null>(null);
  const [dismissExamWarning, setDismissExamWarning] = useState(false);
  const [showMockWarning, setShowMockWarning] = useState(false);

  // === EXPORT INSIGHTS SNAPSHOT (READ-ONLY) ===
    useEffect(() => {
    if (!summary.phase) return;

      setMocksInsightsSnapshot({
        phase: summary.phase,
        trend: summary.trend,
        average: summary.average,
        best: summary.best,
        worst: summary.worst,
        phaseHistory,
      });
    }, [
      summary.phase,
      summary.trend,
      summary.average,
      summary.best,
      summary.worst,
      phaseHistory,
    ]);


  const noteWordCount = (note || '').trim() === '' ? 0 : (note || '').trim().split(/\s+/).length;

  useEffect(() => {
    if (!open) return;

    // Check for first-time warning
    try {
      const seen = localStorage.getItem(FIRST_TIME_MOCK_WARNING_KEY);
      if (!seen) {
        setShowMockWarning(true);
      }
    } catch {}

    try {
      const cached = localStorage.getItem(MOCK_HISTORY_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) setHistory(parsed);
      }
    } catch {}

    const fetchHistory = async () => {
      setLoadingHistory(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setLoadingHistory(false);
        return;
      }

      const { data } = await supabase
        .from('mock_entries')
        .select('id, exam_name, score, max_score, accuracy, stress_level, fatigue_level, time_of_day, taken_at, note')
        .eq('user_id', user.id)
        .order('taken_at', { ascending: false })
        .limit(historyLimit);

      if (data) {
        setHistory(data);
        try {
          localStorage.setItem(MOCK_HISTORY_CACHE_KEY, JSON.stringify(data));
        } catch {}
      }
      setLoadingHistory(false);
    };

    fetchHistory();
  }, [open, historyLimit, supabase]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[800] bg-stone-900/90 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      
      {/* MAIN CONTAINER */}
      <div className="bg-[#FDFBF7] border-4 border-black w-[98vw] h-[95vh] max-w-[1600px] shadow-[15px_15px_0_#000] flex flex-col overflow-hidden">

        {/* --- HEADER --- */}
        <div className="flex justify-between items-center p-6 border-b-4 border-black bg-stone-100 shrink-0">
          <div>
            <h2 className="font-serif text-3xl font-black text-black uppercase tracking-tighter">
              Mocks Laboratory
            </h2>
            <p className="text-xs font-black font-mono text-stone-700 uppercase tracking-widest mt-1">
              Data Entry & Analysis Terminal
            </p>
          </div>
          <button
            onClick={onClose}
            className="border-4 border-black px-6 py-2 text-sm font-black uppercase bg-white hover:bg-black hover:text-white transition-colors shadow-[4px_4px_0_#000]"
          >
            Close Panel
          </button>
        </div>

        {/* --- SPLIT LAYOUT BODY --- */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          
          {/* LEFT COLUMN: INPUT FORM */}
          <div className="lg:w-[35%] w-full border-r-0 lg:border-r-4 border-black bg-white overflow-y-auto p-6 lg:p-8">
            <h3 className="font-black text-base uppercase mb-6 text-black border-b-2 border-black pb-2">
              New Entry
            </h3>
            
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setError(null);

                if (!examName.trim()) {
                  setError('Exam name is required.');
                  return;
                }
                if (!score || !maxScore) {
                  setError('Score details required.');
                  return;
                }

                setSaving(true);
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                  setError('Not authenticated');
                  setSaving(false);
                  return;
                }

                const { error } = await supabase.from('mock_entries').insert({
                  user_id: user.id,
                  exam_name: examName.trim(),
                  score: Number(score),
                  max_score: Number(maxScore),
                  accuracy: accuracy ? Number(accuracy) : null,
                  stress_level: stress ? Number(stress) : null,
                  fatigue_level: fatigue ? Number(fatigue) : null,
                  time_of_day: timeOfDay ? timeOfDay.toLowerCase() : null,
                  note: note || null,
                });

                setSaving(false);

                if (error) {
                  setError(error.message);
                  return;
                }

                setExamName(''); setScore(''); setMaxScore(''); setAccuracy('');
                setStress(''); setFatigue(''); setTimeOfDay(''); setNote('');
                localStorage.removeItem(MOCK_HISTORY_CACHE_KEY);
                setHistory([]);
                setHistoryLimit(20);
              }}
              className="space-y-6"
            >
              {/* Exam Name */}
              <div>
                <label className="block text-xs font-black text-black uppercase mb-2">Exam Name</label>
                <input
                  type="text"
                  autoFocus
                  value={examName}
                  onChange={(e) => setExamName(e.target.value)}
                  className="w-full border-4 border-stone-300 focus:border-black p-3 font-bold font-mono text-base text-black placeholder:text-stone-400 focus:bg-stone-50 outline-none"
                  placeholder="e.g. UPSC PRELIMS GS 1"
                />
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                  <label className="block text-xs font-black text-black uppercase mb-2">Score</label>
                  <input
                    type="number"
                    value={score}
                    onChange={(e) => setScore(e.target.value)}
                    className="w-full border-4 border-stone-300 focus:border-black p-3 font-bold font-mono text-base text-black focus:bg-stone-50 outline-none"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-xs font-black text-black uppercase mb-2">Max</label>
                  <input
                    type="number"
                    value={maxScore}
                    onChange={(e) => setMaxScore(e.target.value)}
                    className="w-full border-4 border-stone-300 focus:border-black p-3 font-bold font-mono text-base text-black focus:bg-stone-50 outline-none"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-xs font-black text-black uppercase mb-2">Acc %</label>
                  <input
                    type="number"
                    value={accuracy}
                    onChange={(e) => setAccuracy(e.target.value)}
                    className="w-full border-4 border-stone-300 focus:border-black p-3 font-bold font-mono text-base text-black focus:bg-stone-50 outline-none"
                  />
                </div>
              </div>

              {/* Bio-Data Grid */}
              <div className="grid grid-cols-3 gap-4 bg-stone-100 p-4 border-2 border-stone-200">
                <div>
                  <label className="block text-[11px] font-black uppercase mb-2 text-stone-600">Stress (1-10)</label>
                  <input
                    type="number" min={1} max={10}
                    value={stress}
                    onChange={(e) => setStress(e.target.value)}
                    className="w-full border-2 border-stone-400 p-2 font-bold font-mono text-sm text-black"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase mb-2 text-stone-600">Fatigue (1-10)</label>
                  <input
                    type="number" min={1} max={10}
                    value={fatigue}
                    onChange={(e) => setFatigue(e.target.value)}
                    className="w-full border-2 border-stone-400 p-2 font-bold font-mono text-sm text-black"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase mb-2 text-stone-600">Time</label>
                  <select
                    value={timeOfDay}
                    onChange={(e) => setTimeOfDay(e.target.value)}
                    className="w-full border-2 border-stone-400 p-2 font-bold font-mono text-sm h-[40px] text-black bg-white"
                  >
                    <option value="">-</option>
                    <option value="morning">Morn</option>
                    <option value="afternoon">After</option>
                    <option value="evening">Eve</option>
                    <option value="night">Night</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-black text-black uppercase mb-2">Observation Notes</label>
                <textarea
                  rows={4}
                  value={note}
                  onChange={(e) => {
                    const words = e.target.value.trim().split(/\s+/);
                    if (words.length <= 100) setNote(e.target.value);
                  }}
                  className="w-full border-4 border-stone-300 focus:border-black p-3 font-bold font-mono text-sm text-black focus:bg-stone-50 resize-none outline-none"
                  placeholder="Analysis of mistakes..."
                />
                <div className="text-right text-[11px] font-black font-mono text-stone-500 mt-1">
                  {noteWordCount}/100 words
                </div>
              </div>

              {error && (
                <div className="text-sm font-bold font-mono text-white bg-red-600 border-2 border-black p-3">
                  ⚠ {error}
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="w-full py-4 bg-black text-white font-black uppercase tracking-[0.2em] hover:bg-stone-800 disabled:opacity-50 text-base border-4 border-black hover:border-stone-600 transition-all shadow-[6px_6px_0_#444]"
              >
                {saving ? 'WRITING...' : 'LOG ENTRY'}
              </button>
            </form>
          </div>

          {/* RIGHT COLUMN: HISTORY LIST */}
          <div className="lg:w-[65%] w-full bg-[#FDFBF7] overflow-y-auto flex flex-col">
            
            {/* === FIRST TIME MOCK WARNING === */}
            {showMockWarning && (
              <div className="mx-6 lg:mx-8 mb-4 border-2 border-dashed border-stone-400 bg-white px-4 py-3 text-xs font-bold font-mono text-stone-700 mt-6">
                ⚠️ Mocks are used for long-term analysis. Avoid test or random entries,
                as they may affect trends and phase insights.

                <div className="mt-2 text-right">
                  <button
                    onClick={() => {
                      try {
                        localStorage.setItem(FIRST_TIME_MOCK_WARNING_KEY, '1');
                      } catch {}
                      setShowMockWarning(false);
                    }}
                    className="text-xs font-black underline hover:text-black"
                  >
                    Got it
                  </button>
                </div>
              </div>
            )}

            {/* === SUMMARY STRIP === */}
            <div className={`px-6 lg:px-8 py-4 border-b-4 border-black bg-stone-100 ${showMockWarning ? 'border-t-2 border-t-stone-200' : ''}`}>
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-4 text-center">
                <div>
                  <div className="text-[11px] font-black uppercase text-stone-600">Total</div>
                  <div className="text-xl font-black text-black">{summary.total}</div>
                </div>

                <div>
                  <div className="text-[11px] font-black uppercase text-stone-600">Average</div>
                  <div className="text-xl font-black text-black">
                    {summary.average !== null ? `${summary.average}%` : '—'}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-black uppercase text-stone-600">Best</div>
                  <div className="text-xl font-black text-black">
                    {summary.best !== null ? `${summary.best}%` : '—'}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-black uppercase text-stone-600">Worst</div>
                  <div className="text-xl font-black text-black">
                    {summary.worst !== null ? `${summary.worst}%` : '—'}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-black uppercase text-stone-600">Trend</div>
                  <div className="text-xl font-black text-black">
                    {summary.trend === 'up' && '↑'}
                    {summary.trend === 'down' && '↓'}
                    {summary.trend === 'stable' && '→'}
                    {summary.trend === null && '—'}
                  </div>
                </div>

                {/* --- PHASE TOOLTIP UI & GUIDANCE --- */}
                <div className="flex flex-col items-center justify-start">
                  
                  {/* Tooltip Wrapper */}
                  <div className="relative group">
                    <div className="text-[11px] font-black uppercase text-stone-600">
                      Phase
                    </div>

                    <div className="text-xl font-black text-black cursor-help">
                      {summary.phase || '—'}
                    </div>

                    {/* Tooltip */}
                    <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 hidden group-hover:block z-20 w-[260px] border-2 border-black bg-white p-3 text-xs font-bold font-mono text-stone-700 shadow-[4px_4px_0_#000]">
                      <div className="mb-1 font-black text-black">
                        {summary.phase}
                      </div>

                      {summary.phase === 'Instability' && (
                        <div>Scores are inconsistent or trending down. Focus on basics and accuracy.</div>
                      )}
                      {summary.phase === 'Stability' && (
                        <div>Performance is steady. Push weak areas to trigger growth.</div>
                      )}
                      {summary.phase === 'Growth' && (
                        <div>Scores are improving! Maintain this momentum.</div>
                      )}
                      {summary.phase === 'Peak' && (
                        <div>High and consistent performance. Maintain rhythm and avoid burnout.</div>
                      )}
                    </div>
                  </div>

                  {/* Guidance Text Below */}
                  <div className="mt-1 text-[11px] font-bold font-mono text-stone-600 leading-snug">
                    {summary.phase === 'Instability' &&
                      'Focus on fundamentals, accuracy, and reducing errors.'}

                    {summary.phase === 'Stability' &&
                      'Strengthen weak areas and aim for gradual improvements.'}

                    {summary.phase === 'Growth' &&
                      'Maintain mock frequency and deepen post-mock analysis.'}

                    {summary.phase === 'Peak' &&
                      'Preserve consistency and avoid burnout or over-testing.'}
                  </div>
                </div>

              </div>
            </div>

            {/* === EXAM NAME WARNING BANNER === */}
            {hasMixedExams && !dismissExamWarning && (
              <div className="mx-6 lg:mx-8 mt-3 mb-2 border-2 border-dashed border-stone-400 bg-white px-4 py-3 text-xs font-bold font-mono text-stone-700">
                ⚠️ For accurate trends and phase analysis, keep exam names consistent
                (e.g. <span className="italic">“Bank PO Prelims”</span> or
                <span className="italic"> “UPSC Prelims”</span>). Mixed exam names can affect insights.
                
                <div className="mt-2 text-right">
                  <button
                    onClick={() => setDismissExamWarning(true)}
                    className="text-xs font-black underline hover:text-black"
                  >
                    Got it
                  </button>
                </div>
              </div>
            )}

            {/* === PHASE HISTORY UI === */}
            {phaseHistory.length > 1 && (
              <div className="mx-6 lg:mx-8 mt-4 mb-6 border-4 border-black bg-white shadow-[6px_6px_0_#000]">
                <div className="px-4 py-3 border-b-4 border-black bg-stone-100 font-black uppercase text-sm">
                  Phase Progress
                </div>

                <div className="divide-y-2 divide-stone-200">
                  {phaseHistory.slice(-10).map((p, idx) => (
                    <div
                      key={idx}
                      className="px-4 py-3 flex justify-between text-sm font-mono font-bold text-stone-800"
                    >
                      <span>
                        {new Date(p.date).toLocaleDateString()}
                      </span>
                      <span>{p.phase}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* HEADER FOR LIST */}
            <div className="p-6 lg:p-8 sticky top-0 bg-[#FDFBF7]/95 backdrop-blur z-10 border-b-4 border-stone-200 flex justify-between items-center">
              <h3 className="font-black text-base uppercase text-stone-800">
                Log History
              </h3>
              <div className="text-sm font-bold font-mono text-stone-900 bg-stone-200 px-2 py-1 rounded-sm">
                {history.length} ENTRIES
              </div>
            </div>

            <div className="p-6 lg:p-8 pt-6">
              {loadingHistory ? (
                <div className="py-12 text-center text-base font-bold font-mono text-black animate-pulse">
                  RETRIEVING DATA...
                </div>
              ) : history.length === 0 ? (
                <div className="py-12 text-center border-4 border-dashed border-stone-400 text-stone-600 font-bold font-mono text-base">
                  NO DATA AVAILABLE. LOG YOUR FIRST MOCK.
                </div>
              ) : (
                <div className="space-y-4">
                  {history.map((m) => (
                    <Fragment key={m.id}>
                      <div
                        onClick={() => setExpandedMockId(prev => prev === m.id ? null : m.id)}
                        className={`group cursor-pointer border-4 transition-all duration-200 ${
                          expandedMockId === m.id 
                            ? 'border-black bg-white shadow-[8px_8px_0_#000]' 
                            : 'border-stone-300 hover:border-black bg-white'
                        }`}
                      >
                        {/* CARD HEADER */}
                        <div className="p-4 flex justify-between items-center">
                          <div className="flex-1">
                            <div className="font-black text-black text-lg mb-1 tracking-tight">
                              {m.exam_name}
                            </div>
                            <div className="text-xs font-bold font-mono text-stone-600 uppercase flex gap-3">
                              <span>{new Date(m.taken_at).toLocaleDateString()}</span>
                              {m.time_of_day && <span className="text-stone-800">| {m.time_of_day.toUpperCase()}</span>}
                            </div>
                          </div>

                          <div className="text-right pl-4">
                            <div className="text-2xl font-black text-black leading-none">
                              {m.score}<span className="text-base text-stone-500 font-bold">/{m.max_score}</span>
                            </div>
                            {m.accuracy !== null && (
                              <div className={`text-xs font-bold font-mono mt-1 ${m.accuracy > 80 ? 'text-green-700' : 'text-stone-600'}`}>
                                {m.accuracy}% ACC
                              </div>
                            )}
                          </div>
                        </div>

                        {/* EXPANDED DETAILS */}
                        {expandedMockId === m.id && (
                          <div className="px-4 pb-4 pt-0 border-t-2 border-stone-200 mt-2 bg-stone-100">
                            <div className="grid grid-cols-3 gap-4 py-4">
                              {/* Stat Blocks */}
                              {m.stress_level && (
                                <div className="text-center">
                                  <div className="text-[10px] uppercase text-stone-500 font-black mb-1">Stress</div>
                                  <div className="font-mono font-black text-lg text-black">{m.stress_level}/10</div>
                                </div>
                              )}
                              {m.fatigue_level && (
                                <div className="text-center">
                                  <div className="text-[10px] uppercase text-stone-500 font-black mb-1">Fatigue</div>
                                  <div className="font-mono font-black text-lg text-black">{m.fatigue_level}/10</div>
                                </div>
                              )}
                            </div>

                            {/* Note Block */}
                            {m.note && (
                              <div className="mt-2 p-4 bg-white border-2 border-stone-300 italic text-black text-sm font-medium leading-relaxed shadow-sm">
                                “{m.note}”
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </Fragment>
                  ))}
                </div>
              )}

              {history.length >= historyLimit && (
                <button
                  onClick={() => setHistoryLimit((p) => p + 20)}
                  className="w-full mt-8 py-4 border-4 border-dashed border-stone-400 text-stone-600 text-sm font-black uppercase hover:border-black hover:text-black hover:bg-white transition-all"
                >
                  Load older archives
                </button>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );  
}