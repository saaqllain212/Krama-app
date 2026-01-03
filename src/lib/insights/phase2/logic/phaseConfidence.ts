export type PhaseConfidenceResult =
  | { status: 'insufficient-data' }
  | {
      phase: string;
      confidence: 'low' | 'medium' | 'high';
      matchCount: number;
    };

export function calculatePhaseConfidence(
  phases: string[]
): PhaseConfidenceResult {
  if (!phases || phases.length < 3) {
    return { status: 'insufficient-data' };
  }

  const recent = phases.slice(-5);
  const currentPhase = recent[recent.length - 1];

  const matchCount = recent.filter(p => p === currentPhase).length;

  let confidence: 'low' | 'medium' | 'high' = 'low';

  if (matchCount >= 5) confidence = 'high';
  else if (matchCount >= 3) confidence = 'medium';

  return {
    phase: currentPhase,
    confidence,
    matchCount,
  };
}
