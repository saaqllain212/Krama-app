'use client';

type Phase = 'Instability' | 'Stability' | 'Growth' | 'Peak' | null;

export type MocksInsightsSnapshot = {
  phase: Phase;
  trend: 'up' | 'down' | 'stable' | null;
  average: number | null;
  best: number | null;
  worst: number | null;
  phaseHistory: {
    date: string;
    phase: Phase;
  }[];
};

let snapshot: MocksInsightsSnapshot | null = null;

export function setMocksInsightsSnapshot(data: MocksInsightsSnapshot) {
  snapshot = data;
}

export function getMocksInsightsSnapshot() {
  return snapshot;
}
