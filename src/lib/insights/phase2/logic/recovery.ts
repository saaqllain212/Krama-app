export type RecoveryResult =
  | { status: 'insufficient-data' }
  | { status: 'none' }
  | {
      status: 'fast' | 'moderate' | 'slow';
      recoveryMocks: number;
      dropScore: number;
      baseline: number;
    };

export function calculateRecovery(
  percentages: number[]
): RecoveryResult {
  // Need at least 5 mocks to judge recovery meaningfully
  if (!percentages || percentages.length < 5) {
    return { status: 'insufficient-data' };
  }

  // Use last 5 mocks to define baseline
  const recentWindow = percentages.slice(-5);
  const baseline =
    recentWindow.reduce((a, b) => a + b, 0) / recentWindow.length;

  const dropThreshold = baseline - 10;

  // Walk backward to find most recent "bad mock"
  for (let i = percentages.length - 1; i >= 0; i--) {
    const score = percentages[i];

    if (score <= dropThreshold) {
      // Found a dip — now check recovery
      let recoveryCount = 0;

      for (let j = i + 1; j < percentages.length; j++) {
        recoveryCount++;

        if (percentages[j] >= baseline) {
          if (recoveryCount <= 2) {
            return {
              status: 'fast',
              recoveryMocks: recoveryCount,
              dropScore: score,
              baseline: Math.round(baseline),
            };
          }

          if (recoveryCount <= 4) {
            return {
              status: 'moderate',
              recoveryMocks: recoveryCount,
              dropScore: score,
              baseline: Math.round(baseline),
            };
          }

          return {
            status: 'slow',
            recoveryMocks: recoveryCount,
            dropScore: score,
            baseline: Math.round(baseline),
          };
        }
      }

      // Dip happened but no recovery yet
      return { status: 'none' };
    }
  }

  // No meaningful dip detected
  return { status: 'none' };
}
