// Tile index: 0-8=1m-9m, 9-17=1p-9p, 18-26=1s-9s
// 27=East(東) 28=South(南) 29=West(西) 30=North(北) 31=Haku(白) 32=Hatsu(発) 33=Chun(中)

export type TileIndex = number; // 0-33

export interface DiscardAnalysis {
  discard: TileIndex;
  shantenAfter: number;        // shanten of the 12-tile hand after discard
  acceptableTiles: TileIndex[]; // tiles that reduce shanten when drawn
  ukeireCount: number;          // total remaining tiles that reduce shanten
  handValue: number;            // estimated hand value multiplier
  ev: number;                   // expected value score (normalized 0-100)
  reasons: string[];
}

export interface AppState {
  hand: TileIndex[];           // 13 tiles as array
  counts: number[];            // 34-element count array
  remaining: number[];         // remaining tiles in unseen deck
  doraIndicators: TileIndex[];
  kitaPulled: number;          // how many 北 have been pulled
  phase: 'deal' | 'select' | 'result';
  selectedDiscard: TileIndex | null;
  analysis: DiscardAnalysis[];
}
