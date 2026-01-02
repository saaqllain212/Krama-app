import Link from 'next/link';

export default function MocksInsightsPage() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] p-8 max-w-4xl mx-auto">

      {/* Back Link */}
      <Link
        href="/mocks"
        className="inline-block mb-6 text-sm font-black uppercase underline"
      >
        ← Back to Mocks
      </Link>

      {/* Page Title */}
      <h1 className="text-3xl font-black uppercase mb-8">
        Insights
      </h1>

      {/* ===================== */}
      {/* CURRENT PHASE SNAPSHOT */}
      {/* ===================== */}
      <section className="mb-10 border-4 border-black bg-white p-6 shadow-[6px_6px_0_#000]">
        <div className="text-xs font-black uppercase text-stone-500 mb-2">
          Current Phase
        </div>
        <div className="text-2xl font-black mb-3">
          Growth
        </div>
        <p className="text-sm font-mono text-stone-700 leading-relaxed">
          Your recent mocks show improving performance with increasing consistency.
        </p>
      </section>

      {/* ===================== */}
      {/* COACH NOTE */}
      {/* ===================== */}
      <section className="mb-12">
        <div className="text-sm font-black uppercase mb-2">
          Coach’s Note
        </div>
        <div className="border-l-4 border-black pl-4 text-sm font-mono text-stone-700 leading-relaxed">
          Your recent mocks indicate steady improvement.
          Whatever you’re doing right now is working — focus on consistency rather than intensity.
        </div>
      </section>

      {/* ===================== */}
      {/* PHASE JOURNEY */}
      {/* ===================== */}
      <section className="mb-12">
        <h2 className="text-lg font-black uppercase mb-4">
          Phase Journey
        </h2>
        <ul className="space-y-2 text-sm font-mono text-stone-700">
          <li>• Started in <strong>Instability</strong></li>
          <li>• Moved into <strong>Stability</strong> after a few mocks</li>
          <li>• Entered <strong>Growth</strong> in recent tests</li>
        </ul>
        <p className="mt-3 text-xs font-mono text-stone-500">
          Showing recent phase progression only.
        </p>
      </section>

      {/* ===================== */}
      {/* PERFORMANCE PATTERNS */}
      {/* ===================== */}
      <section className="mb-12">
        <h2 className="text-lg font-black uppercase mb-4">
          Performance Patterns
        </h2>
        <ul className="space-y-2 text-sm font-mono text-stone-700">
          <li>• Score dips recover quickly</li>
          <li>• Worst scores are gradually improving</li>
          <li>• Large fluctuations are reducing</li>
        </ul>
      </section>

      {/* ===================== */}
      {/* CONSISTENCY SIGNALS */}
      {/* ===================== */}
      <section className="mb-12">
        <h2 className="text-lg font-black uppercase mb-4">
          Consistency Signals
        </h2>
        <p className="text-sm font-mono text-stone-700 leading-relaxed">
          Recent scores stay within a narrower range, indicating improved stability.
          Single bad mocks are less likely to derail overall performance.
        </p>
      </section>

      {/* ===================== */}
      {/* ACTION GUIDANCE */}
      {/* ===================== */}
      <section className="mb-16">
        <h2 className="text-lg font-black uppercase mb-4">
          What to Focus On Now
        </h2>
        <p className="text-sm font-mono text-stone-700 leading-relaxed">
          Maintain your current mock frequency.
          Prioritize post-mock analysis and avoid unnecessary increases in test volume.
        </p>
      </section>

      {/* Footer Note */}
      <div className="text-xs font-mono text-stone-400 border-t pt-6">
        Insights are interpretive and read-only.
        They explain patterns — not individual results.
      </div>

    </div>
  );
}
