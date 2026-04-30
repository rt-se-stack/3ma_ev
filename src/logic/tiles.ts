import type { TileIndex } from '../types/mahjong';

// 3ma (三麻) deck: 萬子2-8を除く
// man suit: only 1m(0) and 9m(8) exist
export const KITA = 30; // North wind (北)

// Unicode codepoints for each tile index
const UNICODE_MAP: Record<number, number> = {};
// 1m-9m: U+1F007-U+1F00F
for (let i = 0; i < 9; i++) UNICODE_MAP[i] = 0x1F007 + i;
// 1p-9p: U+1F019-U+1F021
for (let i = 0; i < 9; i++) UNICODE_MAP[9 + i] = 0x1F019 + i;
// 1s-9s: U+1F010-U+1F018
for (let i = 0; i < 9; i++) UNICODE_MAP[18 + i] = 0x1F010 + i;
// honors: E=1F000, S=1F001, W=1F002, N=1F003, Haku=1F006, Hatsu=1F005, Chun=1F004
const HONOR_CODES = [0x1F000, 0x1F001, 0x1F002, 0x1F003, 0x1F006, 0x1F005, 0x1F004];
for (let i = 0; i < 7; i++) UNICODE_MAP[27 + i] = HONOR_CODES[i];

export function tileChar(idx: TileIndex): string {
  return String.fromCodePoint(UNICODE_MAP[idx]);
}

export function tileName(idx: TileIndex): string {
  if (idx < 9) return `${idx + 1}m`;
  if (idx < 18) return `${idx - 8}p`;
  if (idx < 27) return `${idx - 17}s`;
  return ['東', '南', '西', '北', '白', '発', '中'][idx - 27];
}

export function tileSuit(idx: TileIndex): 'man' | 'pin' | 'sou' | 'honor' {
  if (idx < 9) return 'man';
  if (idx < 18) return 'pin';
  if (idx < 27) return 'sou';
  return 'honor';
}

// Valid tiles in 3ma (no 2m-8m)
export const SANMA_VALID: TileIndex[] = [
  0, 8,                                        // 1m, 9m
  9, 10, 11, 12, 13, 14, 15, 16, 17,           // 1p-9p
  18, 19, 20, 21, 22, 23, 24, 25, 26,          // 1s-9s
  27, 28, 29, 30, 31, 32, 33,                  // honors
];

// Build the 3ma deck (108 tiles)
export interface DeckTile {
  index: TileIndex;
  isRed: boolean;
}

export function buildDeck(): DeckTile[] {
  const deck: DeckTile[] = [];
  for (const idx of SANMA_VALID) {
    for (let copy = 0; copy < 4; copy++) {
      // 1 red 5p (index 13, 4th copy), 1 red 5s (index 22, 4th copy)
      const isRed = (idx === 13 && copy === 3) || (idx === 22 && copy === 3);
      deck.push({ index: idx, isRed });
    }
  }
  return deck;
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Deal a starting hand: returns [hand tiles, remaining deck tiles]
export function dealHand(): { hand: DeckTile[]; remaining: DeckTile[] } {
  const deck = shuffle(buildDeck());
  return { hand: deck.slice(0, 13), remaining: deck.slice(13) };
}

// Convert tile array to count array (length 34)
export function toCounts(tiles: TileIndex[]): number[] {
  const c = new Array(34).fill(0);
  for (const t of tiles) c[t]++;
  return c;
}

// Convert deck tiles to remaining counts (what's left to draw)
export function toRemainingCounts(deckTiles: DeckTile[]): number[] {
  const c = new Array(34).fill(0);
  for (const t of deckTiles) c[t.index]++;
  return c;
}

// Tile groups for picker UI
export const TILE_GROUPS: { label: string; tiles: TileIndex[] }[] = [
  { label: '萬子', tiles: [0, 8] },
  { label: '筒子', tiles: [9,10,11,12,13,14,15,16,17] },
  { label: '索子', tiles: [18,19,20,21,22,23,24,25,26] },
  { label: '字牌', tiles: [27,28,29,30,31,32,33] },
];

// Calculate remaining tiles considering all visible tiles on board
export function calcRemainingFromBoard(
  hand: TileIndex[],
  tsumoTile: TileIndex | null,
  discard1: TileIndex[],
  discard2: TileIndex[],
  doraIndicators: TileIndex[],
  kitaPulled: number,
  selfDiscards: TileIndex[] = [],
): number[] {
  // Start with full 3ma deck (4 copies each)
  const remaining = new Array(34).fill(0);
  for (const t of SANMA_VALID) remaining[t] = 4;

  const sub = (t: TileIndex) => { if (remaining[t] > 0) remaining[t]--; };

  hand.forEach(sub);
  if (tsumoTile !== null) sub(tsumoTile);
  discard1.forEach(sub);
  discard2.forEach(sub);
  selfDiscards.forEach(sub);
  doraIndicators.forEach(sub);
  for (let i = 0; i < kitaPulled; i++) sub(KITA);

  return remaining;
}

// Get the dora tile from indicator
export function doraFromIndicator(indicator: TileIndex): TileIndex {
  if (indicator < 9) {
    if (indicator === 8) return 0; // 9m → 1m (but in 3ma only 1m and 9m exist)
    // In 3ma, 2m-8m don't exist. For man suit dora chain: 1m→9m→1m
    if (indicator === 0) return 8;
    return indicator + 1;
  }
  if (indicator < 18) {
    return indicator === 17 ? 9 : indicator + 1; // 9p→1p
  }
  if (indicator < 27) {
    return indicator === 26 ? 18 : indicator + 1; // 9s→1s
  }
  if (indicator < 31) {
    return indicator === 30 ? 27 : indicator + 1; // N→E
  }
  return indicator === 33 ? 31 : indicator + 1; // Chun→Haku
}
