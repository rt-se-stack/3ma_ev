import type { TileIndex, DiscardAnalysis } from '../types/mahjong';
import { calcShanten } from './shanten';
import { KITA, tileName, doraFromIndicator } from './tiles';

// ──────────────────────────────────────────────
// Ukeiremap: tiles that reduce shanten when drawn
// ──────────────────────────────────────────────
function calcUkeiremap(
  countsAfterDiscard: number[],
  remaining: number[],
  currentShanten: number,
): { acceptableTiles: TileIndex[]; ukeireCount: number } {
  const c = countsAfterDiscard;
  const acceptable: TileIndex[] = [];
  let total = 0;

  for (let draw = 0; draw < 34; draw++) {
    if (remaining[draw] === 0) continue;
    c[draw]++;
    const s = calcShanten(c);
    c[draw]--;
    if (s < currentShanten) {
      acceptable.push(draw);
      total += remaining[draw];
    }
  }
  return { acceptableTiles: acceptable, ukeireCount: total };
}

// ──────────────────────────────────────────────
// Hand value estimator (multiplier, not absolute points)
// Considers potential yaku, dora, speed
// ──────────────────────────────────────────────
function estimateHandValue(
  counts: number[],
  doraIndicators: TileIndex[],
  kitaPulled: number,
): number {
  let score = 1.0;

  // Count tiles per region
  const manCount = counts[0] + counts[8]; // only 1m and 9m in 3ma
  const pinCount = counts.slice(9, 18).reduce((a, b) => a + b, 0);
  const souCount = counts.slice(18, 27).reduce((a, b) => a + b, 0);
  const honorCount = counts.slice(27).reduce((a, b) => a + b, 0);
  const totalTiles = manCount + pinCount + souCount + honorCount;

  // Tanyao potential: no 1m/9m/1p/9p/1s/9s/honors
  const tanyaoTiles = manCount + counts[9] + counts[17] + counts[18] + counts[26] + honorCount;
  if (tanyaoTiles === 0) score *= 1.4; // pure tanyao hand

  // Honitsu/Chinitsu potential
  const suitCount = [manCount > 0 ? 1 : 0, pinCount > 0 ? 1 : 0, souCount > 0 ? 1 : 0];
  const activeSuits = suitCount.reduce((a, b) => a + b, 0);
  if (activeSuits === 1 && honorCount === 0 && totalTiles >= 10) {
    score *= 2.5; // Chinitsu potential (strongest)
  } else if (activeSuits === 1 && honorCount > 0 && totalTiles >= 10) {
    score *= 1.6; // Honitsu potential
  }

  // Yakuhai (dragon/seat wind triplet potential)
  const yakuhaiBonus = [31, 32, 33].reduce((acc, i) => acc + (counts[i] >= 2 ? 0.3 : 0), 0);
  score *= (1 + yakuhaiBonus);

  // Dora count
  const doraCount = doraIndicators.reduce((acc, ind) => {
    const dora = doraFromIndicator(ind);
    return acc + counts[dora];
  }, 0);
  score *= Math.pow(1.35, doraCount); // each dora ≈ 1 han

  // Red five bonus (5p=13, 5s=22 - red tiles already in hand from deck
  // We approximate: if hand has 5p or 5s, good chance it's red
  // Actual red tracking needs DeckTile info; approximate here
  if (counts[13] > 0) score *= 1.15; // 5p
  if (counts[22] > 0) score *= 1.15; // 5s

  // 北抜き bonus: each pulled 北 ≈ 1 uradora on average
  score *= Math.pow(1.2, kitaPulled);

  // Chiitoitsu potential bonus
  const pairCount = counts.filter(c => c >= 2).length;
  if (pairCount >= 4) score *= 1.2;

  return score;
}

// ──────────────────────────────────────────────
// Generate explanatory reasons for a discard
// ──────────────────────────────────────────────
function buildReasons(
  _discard: TileIndex,
  shantenBefore: number,
  analysis: Omit<DiscardAnalysis, 'reasons' | 'ev'>,
  allAnalyses: Array<Omit<DiscardAnalysis, 'reasons' | 'ev'>>,
  isKita: boolean,
): string[] {
  const reasons: string[] = [];

  if (isKita) {
    reasons.push('北は必ず抜きましょう（ドラ候補・安全牌確保）');
    return reasons;
  }

  // Shanten improvement
  if (analysis.shantenAfter < shantenBefore - 1) {
    reasons.push(`向聴数: ${shantenBefore}向聴 → ${analysis.shantenAfter}向聴（大幅改善）`);
  } else if (analysis.shantenAfter < shantenBefore) {
    reasons.push(`向聴数: ${shantenBefore}向聴 → ${analysis.shantenAfter}向聴（改善）`);
  } else if (analysis.shantenAfter === shantenBefore) {
    reasons.push(`向聴数: ${shantenBefore}向聴（変化なし）`);
  } else {
    reasons.push(`向聴数: ${shantenBefore}向聴 → ${analysis.shantenAfter}向聴（悪化・孤立牌）`);
  }

  // Ukeiremap
  const maxUkeire = Math.max(...allAnalyses.map(a => a.ukeireCount));
  if (analysis.ukeireCount === maxUkeire && maxUkeire > 0) {
    reasons.push(`受け入れ枚数: ${analysis.ukeireCount}枚（最大）`);
  } else {
    reasons.push(`受け入れ枚数: ${analysis.ukeireCount}枚`);
  }

  // Acceptable tile count
  if (analysis.acceptableTiles.length > 0) {
    const tileNames = analysis.acceptableTiles.slice(0, 6).map(tileName).join(' ');
    const more = analysis.acceptableTiles.length > 6 ? ` 他${analysis.acceptableTiles.length - 6}種` : '';
    reasons.push(`有効牌: ${tileNames}${more}`);
  }

  // Value note
  if (analysis.handValue > 2.0) {
    reasons.push('手牌価値: 高（清一色・混一色方向）');
  } else if (analysis.handValue > 1.4) {
    reasons.push('手牌価値: 中高（役牌・ドラ期待）');
  }

  return reasons;
}

// ──────────────────────────────────────────────
// Main entry: analyze all possible discards
// ──────────────────────────────────────────────
export function analyzeHand(
  _hand: TileIndex[],
  counts: number[],
  remaining: number[],
  doraIndicators: TileIndex[],
  kitaPulled: number,
): DiscardAnalysis[] {
  const shantenBefore = calcShanten(counts);

  const raw: Array<Omit<DiscardAnalysis, 'reasons' | 'ev'>> = [];

  for (let discard = 0; discard < 34; discard++) {
    if (counts[discard] === 0) continue;

    const after = [...counts];
    after[discard]--;

    const shantenAfter = calcShanten(after);
    const { acceptableTiles, ukeireCount } = calcUkeiremap(
      after,
      remaining,
      shantenBefore,
    );
    const handValue = estimateHandValue(after, doraIndicators, kitaPulled);

    raw.push({ discard, shantenAfter, acceptableTiles, ukeireCount, handValue });
  }

  // Normalize EV: speedScore × valueScore
  const maxUkeire = Math.max(...raw.map(r => r.ukeireCount), 1);
  const maxValue = Math.max(...raw.map(r => r.handValue), 1);

  const withEV = raw.map(r => ({
    ...r,
    ev: (r.ukeireCount / maxUkeire) * 0.6 * 100 +
        (r.handValue / maxValue) * 0.4 * 100,
  }));

  const maxEV = Math.max(...withEV.map(r => r.ev), 1);

  const final: DiscardAnalysis[] = withEV.map(r => ({
    ...r,
    ev: Math.round((r.ev / maxEV) * 100),
    reasons: buildReasons(
      r.discard,
      shantenBefore,
      r,
      raw,
      r.discard === KITA,
    ),
  }));

  // Sort: 北 first (always pull), then by EV descending
  final.sort((a, b) => {
    if (a.discard === KITA && b.discard !== KITA) return -1;
    if (b.discard === KITA && a.discard !== KITA) return 1;
    // Primary: shanten (lower = better)
    if (a.shantenAfter !== b.shantenAfter) return a.shantenAfter - b.shantenAfter;
    // Secondary: ukeire (higher = better)
    if (b.ukeireCount !== a.ukeireCount) return b.ukeireCount - a.ukeireCount;
    // Tertiary: EV
    return b.ev - a.ev;
  });

  return final;
}

// Shanten of current hand (for display)
export { calcShanten };
