// lib/mocksInsightsStore.ts
// Read-only transient store for Insights page
// NO calculations here

export type PhaseType =
  | 'Instability'
  | 'Stability'
  | 'Growth'
  | 'Peak'
  | null;

export type InsightsSnapshot = {
  phase: PhaseType;
  trend: 'up' | 'down' | 'stable' | null;
  average: number | null;
  best: number | null;
  worst: number | null;
  phaseHistory: { date: string; phase: string }[];
};

let snapshot: InsightsSnapshot | null = null;

export function setMocksInsightsSnapshot(data: InsightsSnapshot) {
  snapshot = data;
}

export function getMocksInsightsSnapshot(): InsightsSnapshot | null {
  return snapshot;
}
