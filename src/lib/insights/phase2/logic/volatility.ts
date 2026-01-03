export type VolatilityResult =
  | { status: 'insufficient-data' }
  | {
      band: 'narrow' | 'moderate' | 'wide';
      direction: 'improving' | 'worsening' | 'stable';
      recentRange: number;
      previousRange: number | null;
    };

export function calculateVolatility(
  percentages: number[]
): VolatilityResult {
  if (!percentages || percentages.length < 5) {
    return { status: 'insufficient-data' };
  }

  const recent = percentages.slice(-10);
  const recentMax = Math.max(...recent);
  const recentMin = Math.min(...recent);
  const recentRange = recentMax - recentMin;

  let band: 'narrow' | 'moderate' | 'wide' = 'moderate';
  if (recentRange <= 10) band = 'narrow';
  else if (recentRange >= 20) band = 'wide';

  let direction: 'improving' | 'worsening' | 'stable' = 'stable';
  let previousRange: number | null = null;

  if (percentages.length >= 15) {
    const previous = percentages.slice(-15, -5);
    const prevMax = Math.max(...previous);
    const prevMin = Math.min(...previous);
    previousRange = prevMax - prevMin;

    const diff = recentRange - previousRange;

    if (diff <= -5) direction = 'improving';
    else if (diff >= 5) direction = 'worsening';
  }

  return {
    band,
    direction,
    recentRange,
    previousRange,
  };
}
