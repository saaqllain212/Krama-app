import type { PhaseConfidenceResult } from '@/lib/insights/phase2/logic/phaseConfidence';

type Props = {
  phaseConfidence: PhaseConfidenceResult;
};

export default function PhaseConfidenceCard({
  phaseConfidence,
}: Props) {
  // Case 1: Not enough data
  if ('status' in phaseConfidence) {
    return (
      <div className="mt-2 text-xs font-mono text-stone-400">
        Phase confidence: insufficient data
      </div>
    );
  }

  // Case 2: Enough data
  const color =
    phaseConfidence.confidence === 'high'
      ? 'text-green-600'
      : phaseConfidence.confidence === 'medium'
      ? 'text-yellow-600'
      : 'text-red-600';

  const label =
    phaseConfidence.confidence === 'high'
      ? 'High confidence'
      : phaseConfidence.confidence === 'medium'
      ? 'Moderate confidence'
      : 'Low confidence';

  return (
    <div className="mt-2 text-xs font-mono text-stone-600">
      Phase confidence:{' '}
      <span className={`font-black ${color}`}>
        {label}
      </span>{' '}
      <span className="text-stone-400">
        (based on {phaseConfidence.matchCount} recent matches)
      </span>
    </div>
  );
}
