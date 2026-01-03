import type { VolatilityResult } from '@/lib/insights/phase2/logic/volatility';

type Props = {
  volatility: VolatilityResult;
};

export default function VolatilityCard({ volatility }: Props) {
  // Guard — should never happen because phase2Ready exists,
  // but keeps UI future-safe
  if ('status' in volatility) {
    return (
      <div className="rounded-xl border border-dashed border-stone-300 p-5 bg-stone-50">
        <h3 className="text-sm uppercase tracking-wide text-stone-500">
          Performance Volatility
        </h3>
        <p className="mt-2 text-sm font-mono text-stone-500">
          Not enough data to assess volatility.
        </p>
      </div>
    );
  }

  // Translate logic → UI language
  const level =
    volatility.band === 'narrow'
      ? 'Low'
      : volatility.band === 'moderate'
      ? 'Medium'
      : 'High';

  const color =
    volatility.band === 'narrow'
      ? 'text-green-600'
      : volatility.band === 'moderate'
      ? 'text-yellow-600'
      : 'text-red-600';

  const directionText =
    volatility.direction === 'improving'
      ? 'Stability is improving'
      : volatility.direction === 'worsening'
      ? 'Stability is worsening'
      : 'Stability is unchanged';

  return (
    <div className="rounded-xl border border-white/10 p-5 bg-white/5">
      <h3 className="text-sm uppercase tracking-wide text-stone-600">
        Performance Volatility
      </h3>

      <div className={`mt-2 text-xl font-black ${color}`}>
        {level}
      </div>

      <p className="mt-2 text-sm font-mono text-stone-600">
        {directionText}. Recent score range: {volatility.recentRange}%.
      </p>
    </div>
  );
}
