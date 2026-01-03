export type ConsistencyResult =
  | { status: 'insufficient-data' }
  | {
      dominantFactor:
        | 'accuracy'
        | 'stress'
        | 'fatigue'
        | 'mixed'
        | 'none';
      dipCount: number;
    };

function normalize(value: number | null): number | null {
  if (value === null || Number.isNaN(value)) return null;

  // Normalize 1–5 → 0–100, 1–10 → 0–100
  if (value <= 5) return (value / 5) * 100;
  return (value / 10) * 100;
}

export function calculateConsistency(
  percentages: number[],
  accuracy: (number | null)[],
  stress: (number | null)[],
  fatigue: (number | null)[]
): ConsistencyResult {
  if (
    percentages.length < 6 ||
    percentages.length !== accuracy.length ||
    percentages.length !== stress.length ||
    percentages.length !== fatigue.length
  ) {
    return { status: 'insufficient-data' };
  }

  let accuracyHits = 0;
  let stressHits = 0;
  let fatigueHits = 0;
  let dips = 0;

  for (let i = 4; i < percentages.length; i++) {
    const window = percentages.slice(i - 4, i);
    const avg = window.reduce((a, b) => a + b, 0) / window.length;

    if (percentages[i] <= avg - 8) {
      dips++;

      const acc = normalize(accuracy[i]);
      const str = normalize(stress[i]);
      const fat = normalize(fatigue[i]);

      if (acc !== null && acc < 60) accuracyHits++;
      if (str !== null && str > 70) stressHits++;
      if (fat !== null && fat > 70) fatigueHits++;
    }
  }

  if (dips === 0) {
    return { dominantFactor: 'none', dipCount: 0 };
  }

  const max = Math.max(accuracyHits, stressHits, fatigueHits);

  const dominant =
    [accuracyHits, stressHits, fatigueHits].filter(v => v === max).length > 1
      ? 'mixed'
      : max === accuracyHits
      ? 'accuracy'
      : max === stressHits
      ? 'stress'
      : 'fatigue';

  return {
    dominantFactor: dominant,
    dipCount: dips,
  };
}
