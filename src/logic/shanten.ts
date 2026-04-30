// Shanten number calculation for riichi mahjong (works for 3ma)
// Tile indices: 0-8=man, 9-17=pin, 18-26=sou, 27-33=honors
// In 3ma, tiles 1-7 (2m-8m) count=0, algorithm handles this automatically

export function calcShanten(counts: number[]): number {
  return Math.min(
    calcNormalShanten(counts),
    calcChiitoiShanten(counts),
    calcKokushiShanten(counts),
  );
}

// Shanten for standard hand (4 mentsu + 1 jantai)
export function calcNormalShanten(counts: number[]): number {
  const c = [...counts];
  let best = 0;

  function dfs(i: number, mentsu: number, taatsu: number, jantai: number) {
    // Advance to next non-empty position
    while (i < 34 && c[i] === 0) i++;
    if (i >= 34) {
      const effTaatsu = Math.min(taatsu, 4 - mentsu);
      const score = 2 * mentsu + effTaatsu + (jantai ? 1 : 0);
      if (score > best) best = score;
      return;
    }

    if (i >= 27) {
      // Honor tiles: only triplet or pair possible
      if (c[i] >= 3) {
        c[i] -= 3;
        dfs(i + 1, mentsu + 1, taatsu, jantai);
        c[i] += 3;
      }
      if (!jantai && c[i] >= 2) {
        c[i] -= 2;
        dfs(i + 1, mentsu, taatsu, 1);
        c[i] += 2;
      }
      if (c[i] >= 2) {
        c[i] -= 2;
        dfs(i + 1, mentsu, taatsu + 1, jantai);
        c[i] += 2;
      }
      dfs(i + 1, mentsu, taatsu, jantai);
      return;
    }

    const n = i % 9; // position within suit (0=1, 8=9)

    // Triplet (koutsu)
    if (c[i] >= 3) {
      c[i] -= 3;
      dfs(i, mentsu + 1, taatsu, jantai);
      c[i] += 3;
    }
    // Sequence (shuntsu): need n<=6 to stay in suit
    if (n <= 6 && c[i + 1] > 0 && c[i + 2] > 0) {
      c[i]--; c[i + 1]--; c[i + 2]--;
      dfs(i, mentsu + 1, taatsu, jantai);
      c[i]++; c[i + 1]++; c[i + 2]++;
    }
    // Pair as jantai
    if (!jantai && c[i] >= 2) {
      c[i] -= 2;
      dfs(i, mentsu, taatsu, 1);
      c[i] += 2;
    }
    // Pair as taatsu
    if (c[i] >= 2) {
      c[i] -= 2;
      dfs(i, mentsu, taatsu + 1, jantai);
      c[i] += 2;
    }
    // Kanchan (gap sequence: i, _, i+2)
    if (n <= 6 && c[i + 2] > 0) {
      c[i]--; c[i + 2]--;
      dfs(i, mentsu, taatsu + 1, jantai);
      c[i]++; c[i + 2]++;
    }
    // Adjacent (ryanmen/penchan: i, i+1)
    if (n <= 7 && c[i + 1] > 0) {
      c[i]--; c[i + 1]--;
      dfs(i, mentsu, taatsu + 1, jantai);
      c[i]++; c[i + 1]++;
    }
    // Skip tile(s) at position i (treat as isolated)
    dfs(i + 1, mentsu, taatsu, jantai);
  }

  dfs(0, 0, 0, 0);
  return 8 - best;
}

// Shanten for chiitoitsu (7 pairs)
export function calcChiitoiShanten(counts: number[]): number {
  let pairs = 0;
  let kinds = 0;
  for (let i = 0; i < 34; i++) {
    if (counts[i] >= 1) kinds++;
    if (counts[i] >= 2) pairs++;
  }
  const base = 6 - pairs;
  // Need at least 7 distinct tile types
  return kinds < 7 ? base + (7 - kinds) : base;
}

// Shanten for kokushi musou
export function calcKokushiShanten(counts: number[]): number {
  // Terminals and honors needed for kokushi
  const kokushi = [0, 8, 9, 17, 18, 26, 27, 28, 29, 30, 31, 32, 33];
  let unique = 0;
  let hasPair = false;
  for (const i of kokushi) {
    if (counts[i] > 0) {
      unique++;
      if (counts[i] >= 2) hasPair = true;
    }
  }
  return 13 - unique - (hasPair ? 1 : 0);
}
