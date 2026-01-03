import type { VolatilityResult } from '@/lib/insights/phase2/logic/volatility';
import type { ConsistencyResult } from '@/lib/insights/phase2/logic/consistency';
import type { PhaseConfidenceResult } from '@/lib/insights/phase2/logic/phaseConfidence';

type Props = {
  phase: string;
  phaseConfidence: PhaseConfidenceResult | null;
  volatility: VolatilityResult | null;
  consistency: ConsistencyResult | null;
};

export default function PhaseSummaryStrip({
  phase,
  phaseConfidence,
  volatility,
  consistency,
}: Props) {
  const confidenceLabel =
    phaseConfidence && 'confidence' in phaseConfidence
      ? phaseConfidence.confidence
      : '—';

  const volatilityLabel =
    volatility && 'band' in volatility
      ? volatility.band
      : '—';

  const consistencyLabel =
    consistency && 'dominantFactor' in consistency
      ? consistency.dominantFactor
      : '—';

  return (
    <div className="mb-8 rounded-xl border border-black bg-white px-4 py-3 shadow-[6px_6px_0_#000]">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
        <div>
          <div className="text-[11px] font-black uppercase text-stone-500">
            Phase
          </div>
          <div className="text-sm font-mono text-stone-800">
            {phase}
          </div>
        </div>

        <div>
          <div className="text-[11px] font-black uppercase text-stone-500">
            Confidence
          </div>
          <div className="text-sm font-mono text-stone-800">
            {confidenceLabel}
          </div>
        </div>

        <div>
          <div className="text-[11px] font-black uppercase text-stone-500">
            Volatility
          </div>
          <div className="text-sm font-mono text-stone-800">
            {volatilityLabel}
          </div>
        </div>

        <div>
          <div className="text-[11px] font-black uppercase text-stone-500">
            Consistency
          </div>
          <div className="text-sm font-mono text-stone-800">
            {consistencyLabel}
          </div>
        </div>
      </div>
    </div>
  );
}
