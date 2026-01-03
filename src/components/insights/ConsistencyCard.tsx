import type { ConsistencyResult } from '@/lib/insights/phase2/logic/consistency';

type Props = {
  consistency: ConsistencyResult;
};

export default function ConsistencyCard({ consistency }: Props) {
  // Insufficient data guard
  if ('status' in consistency) {
    return (
      <div className="rounded-xl border border-dashed border-stone-300 p-5 bg-stone-50">
        <h3 className="text-sm uppercase tracking-wide text-stone-500">
          Consistency Analysis
        </h3>
        <p className="mt-2 text-sm font-mono text-stone-500">
          Not enough data to assess consistency.
        </p>
      </div>
    );
  }

  // Human-readable interpretation
  const factorLabel =
    consistency.dominantFactor === 'accuracy'
      ? 'Accuracy gaps'
      : consistency.dominantFactor === 'stress'
      ? 'Stress pressure'
      : consistency.dominantFactor === 'fatigue'
      ? 'Fatigue / burnout'
      : consistency.dominantFactor === 'mixed'
      ? 'Multiple factors'
      : 'No dominant issue';

  const tone =
    consistency.dominantFactor === 'none'
      ? 'text-green-600'
      : consistency.dominantFactor === 'mixed'
      ? 'text-yellow-600'
      : 'text-red-600';

  return (
    <div className="rounded-xl border border-white/10 p-5 bg-white/5">
      <h3 className="text-sm uppercase tracking-wide text-stone-600">
        Consistency Analysis
      </h3>

      <div className={`mt-2 text-xl font-black ${tone}`}>
        {factorLabel}
      </div>

      <p className="mt-2 text-sm font-mono text-stone-600">
        Detected {consistency.dipCount} meaningful performance dips.
      </p>
    </div>
  );
}
