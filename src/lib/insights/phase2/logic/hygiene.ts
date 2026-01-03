export type HygieneResult = {
  issues: {
    mixedExams: boolean;
    irregularFrequency: boolean;
    missingBioData: boolean;
    lowSampleSize: boolean;
  };
  confidenceLevel: 'high' | 'reduced' | 'low';
};

export function evaluateHygiene(
  examNames: string[],
  dates: string[],
  accuracy: (number | null)[],
  stress: (number | null)[],
  fatigue: (number | null)[]
): HygieneResult {
  const issues = {
    mixedExams: false,
    irregularFrequency: false,
    missingBioData: false,
    lowSampleSize: false,
  };

  const count = examNames.length;

  // 1️⃣ Low sample size
  if (count < 5) {
    issues.lowSampleSize = true;
  }

  // 2️⃣ Mixed exams
  const normalized = examNames
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);

  if (new Set(normalized).size > 1) {
    issues.mixedExams = true;
  }

  // 3️⃣ Irregular frequency (gap > 21 days)
  if (dates.length >= 3) {
    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i - 1]).getTime();
      const curr = new Date(dates[i]).getTime();
      const gapDays = (curr - prev) / (1000 * 60 * 60 * 24);

      if (gapDays > 21) {
        issues.irregularFrequency = true;
        break;
      }
    }
  }

  // 4️⃣ Missing bio data (FIXED TYPING)
  const bioMissingCount = accuracy.reduce<number>((acc, _, i) => {
    if (
      accuracy[i] === null &&
      stress[i] === null &&
      fatigue[i] === null
    ) {
      return acc + 1;
    }
    return acc;
  }, 0);

  if (count > 0 && bioMissingCount / count > 0.4) {
    issues.missingBioData = true;
  }

  // --- Confidence aggregation ---
  const issueCount = Object.values(issues).filter(Boolean).length;

  let confidenceLevel: 'high' | 'reduced' | 'low' = 'high';

  if (issueCount >= 2) confidenceLevel = 'reduced';
  if (issueCount >= 3) confidenceLevel = 'low';

  return {
    issues,
    confidenceLevel,
  };
}
