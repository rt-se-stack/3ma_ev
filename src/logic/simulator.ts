import type { TileIndex } from '../types/mahjong';
import { buildDeck, shuffle, KITA } from './tiles';
import type { DeckTile } from './tiles';

export interface SimulatedBoard {
  hand: TileIndex[];
  handRed: boolean[];
  tsumoTile: TileIndex;
  tsumoRed: boolean;
  discard1: TileIndex[];   // 上家
  discard2: TileIndex[];   // 下家
  selfDiscards: TileIndex[];
  doraIndicators: TileIndex[];
  kitaPulled: number;
  turn: number;
  windSelf: string;   // 自分の風
  windOpp1: string;   // 上家の風
  windOpp2: string;   // 下家の風
}

// ──────────────────────────────────────────────
// 対戦相手の捨て牌ヒューリスティック
// 孤立牌（周囲に関連牌がない）から優先的に切る
// ──────────────────────────────────────────────
function connectionScore(tile: TileIndex, hand: TileIndex[]): number {
  // 字牌
  if (tile >= 27) {
    const count = hand.filter(t => t === tile).length;
    if (count >= 3) return 100; // 刻子候補: 残す
    if (count >= 2) return 40;  // 対子: 残す
    return 2;                   // 孤立字牌: 切る
  }

  let score = 0;
  const suit = Math.floor(tile / 9);
  const n = tile % 9;

  for (const other of hand) {
    if (other === tile) continue;
    if (Math.floor(other / 9) !== suit) continue;
    const diff = Math.abs(other % 9 - n);
    if (diff === 0) score += 20; // 対子・刻子
    else if (diff === 1) score += 8;  // 隣接牌（塔子）
    else if (diff === 2) score += 4;  // カンチャン
  }

  // 端牌（1m/9m/1p/9p/1s/9s）は若干切りやすい
  if (n === 0 || n === 8) score = Math.max(0, score - 1);

  return score;
}

function simulateDiscards(dealt: DeckTile[], turns: number): TileIndex[] {
  const hand = dealt.map(d => d.index);
  const discards: TileIndex[] = [];

  for (let t = 0; t < turns; t++) {
    if (hand.length === 0) break;

    let minScore = Infinity;
    let discardIdx = 0;

    for (let i = 0; i < hand.length; i++) {
      const score = connectionScore(hand[i], hand);
      // 同スコアの場合はランダムに選択（単調にならないように）
      if (score < minScore || (score === minScore && Math.random() < 0.25)) {
        minScore = score;
        discardIdx = i;
      }
    }

    discards.push(hand[discardIdx]);
    hand.splice(discardIdx, 1);
  }

  return discards;
}

// ──────────────────────────────────────────────
// 整合性のある盤面を1セット生成する
// ──────────────────────────────────────────────
export function generateBoard(targetTurn?: number): SimulatedBoard {
  const deck = shuffle(buildDeck());

  // 死牌（嶺上牌・ドラ表示牌含む） — 末尾14枚
  const deadWall = deck.slice(deck.length - 14);
  const liveDeck = deck.slice(0, deck.length - 14); // 94枚

  const doraIndicator = deadWall[0].index;

  // 配牌: 各13枚
  const playerDealt = liveDeck.slice(0, 13);
  const opp1Dealt = liveDeck.slice(13, 26);
  const opp2Dealt = liveDeck.slice(26, 39);

  // 山牌（39枚以降）
  const drawDeck = liveDeck.slice(39);

  // 巡目（デフォルト: 4〜8巡）
  const turn = targetTurn ?? (6 + Math.floor(Math.random() * 9));

  // 風牌をランダムに割り当て（東→南→西 の順番は固定、座席をランダムに）
  const winds = shuffle(['東', '南', '西'] as string[]);
  const [windOpp1, windSelf, windOpp2] = winds;

  // 東→南→西 の巡目順。自分より先に打つ相手は今巡 turn 枚、後の相手は turn-1 枚
  const WIND_ORDER = ['東', '南', '西'];
  const selfIdx  = WIND_ORDER.indexOf(windSelf);
  const opp1Idx  = WIND_ORDER.indexOf(windOpp1);
  const opp2Idx  = WIND_ORDER.indexOf(windOpp2);
  const discard1Count = opp1Idx < selfIdx ? turn : Math.max(0, turn - 1);
  const discard2Count = opp2Idx < selfIdx ? turn : Math.max(0, turn - 1);

  const discard1 = simulateDiscards(opp1Dealt, discard1Count);
  const discard2 = simulateDiscards(opp2Dealt, discard2Count);

  // ── 自分の捨て牌シミュレーション（turn-1 回のツモ切りサイクル） ──
  const playerHand = [...playerDealt];
  const selfDiscards: TileIndex[] = [];
  let drawIdx = 0;
  let kitaPulled = 0;

  // 北抜きヘルパー：手牌内の北を全て抜いて山牌から補充
  const pullKita = () => {
    let i = 0;
    while (i < playerHand.length) {
      if (playerHand[i].index === KITA) {
        playerHand.splice(i, 1);
        kitaPulled++;
        if (drawIdx < drawDeck.length) {
          playerHand.push(drawDeck[drawIdx++]);
          i = 0; // 補充牌が北の可能性があるのでリセット
        }
      } else {
        i++;
      }
    }
  };

  // 配牌時の北抜き
  pullKita();

  for (let t = 0; t < turn - 1; t++) {
    if (playerHand.length === 0) break;

    const handIndices = playerHand.map(d => d.index);
    let minScore = Infinity;
    let discardIdx = 0;

    for (let i = 0; i < handIndices.length; i++) {
      const score = connectionScore(handIndices[i], handIndices);
      if (score < minScore || (score === minScore && Math.random() < 0.25)) {
        minScore = score;
        discardIdx = i;
      }
    }

    selfDiscards.push(playerHand[discardIdx].index);
    playerHand.splice(discardIdx, 1);

    // ツモ（山牌から）→ 北なら即抜き
    if (drawIdx < drawDeck.length) {
      playerHand.push(drawDeck[drawIdx++]);
      pullKita();
    }
  }

  // 最後のツモ牌を取得（北なら抜いて次の牌をツモ）
  let tsumoDealt: DeckTile;
  for (;;) {
    if (drawIdx >= drawDeck.length) {
      tsumoDealt = playerHand[playerHand.length - 1]; // 安全策
      break;
    }
    const drawn = drawDeck[drawIdx++];
    if (drawn.index === KITA) {
      kitaPulled++;
    } else {
      tsumoDealt = drawn;
      break;
    }
  }

  // ループ後の 13 枚をソートして手牌とする（ツモ牌は別途）
  playerHand.sort((a, b) => a.index - b.index);
  const hand    = playerHand.map(d => d.index);   // 13 枚
  const handRed = playerHand.map(d => d.isRed);
  const tsumoTile = tsumoDealt.index;              // ＋1 枚
  const tsumoRed  = tsumoDealt.isRed;

  return {
    hand,
    handRed,
    tsumoTile,
    tsumoRed,
    discard1,
    discard2,
    selfDiscards,
    doraIndicators: [doraIndicator],
    kitaPulled,
    turn,
    windSelf,
    windOpp1,
    windOpp2,
  };
}
