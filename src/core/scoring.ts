import type { RegistryCandidate } from './types.js';
import { normalizeComparable } from '../utils/normalize.js';

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i += 1) dp[i][0] = i;
  for (let j = 0; j <= n; j += 1) dp[0][j] = j;
  for (let i = 1; i <= m; i += 1) {
    for (let j = 1; j <= n; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

export function similarity(a: string, b: string): number {
  const na = normalizeComparable(a);
  const nb = normalizeComparable(b);
  if (!na || !nb) return 0;
  const dist = levenshtein(na, nb);
  return 1 - dist / Math.max(na.length, nb.length);
}

export function scoreCandidate(inputName: string, candidate: RegistryCandidate, ids: string[] = []): RegistryCandidate {
  let score = 0;
  const idHit = ids.filter(Boolean).some((id) => candidate.registry_match_id.includes(id));
  if (idHit) score = 0.98;

  const nameScore = similarity(inputName, candidate.registry_match_name);
  if (nameScore >= 0.85) score = Math.max(score, 0.8);
  else if (nameScore >= 0.7) score = Math.max(score, 0.7);

  if (candidate.registry_email && score > 0) score = Math.max(score, 0.9);
  return { ...candidate, registry_confidence: Number(score.toFixed(2)) };
}

export function selectBestCandidate(candidates: RegistryCandidate[]): RegistryCandidate | null {
  return candidates.reduce<RegistryCandidate | null>((best, current) => {
    if (!best) return current;
    return (current.registry_confidence || 0) > (best.registry_confidence || 0) ? current : best;
  }, null);
}
