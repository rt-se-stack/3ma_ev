import React from 'react';
import type { TileIndex } from '../types/mahjong';
import { TileDisplay } from './TileDisplay';
import { HandView } from './HandView';
import { doraFromIndicator } from '../logic/tiles';

interface BoardViewProps {
  hand: TileIndex[];
  handRed: boolean[];
  tsumoTile: TileIndex;
  tsumoRed: boolean;
  discard1: TileIndex[];
  discard2: TileIndex[];
  selfDiscards: TileIndex[];
  doraIndicators: TileIndex[];
  kitaPulled: number;
  turn: number;
  remainingCount: number;
  selectedHandIdx: number | null;
  bestDiscard: TileIndex | null;
  phase: 'deal' | 'select' | 'result';
  onTileClick: (tile: TileIndex, handIdx: number) => void;
  windSelf: string;
  windOpp1: string;
  windOpp2: string;
}

// ── 裏向き牌 1枚 ─────────────────────────────────────
function FaceDownTile({ w, h }: { w: number; h: number }) {
  return (
    <div style={{
      width: w, height: h, flexShrink: 0,
      background: 'linear-gradient(145deg, #3a7d5e 0%, #1b4332 100%)',
      border: '1px solid #52b788',
      borderRadius: 4,
      boxShadow: '1px 2px 4px rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        width: w - 6, height: h - 6,
        border: '1px solid rgba(255,255,255,0.18)',
        borderRadius: 2,
      }} />
    </div>
  );
}

// ── 相手の手牌（裏向き縦並び） ────────────────────────
function OpponentHand({ count, wind, label }: { count: number; wind: string; label: string }) {
  const TW = 24, TH = 34, STEP = 9;
  const totalH = STEP * (count - 1) + TH;
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: 6, padding: '8px 4px',
    }}>
      {/* 風牌バッジ */}
      <div style={{
        background: 'rgba(0,0,0,0.4)', borderRadius: 4,
        padding: '2px 6px', fontSize: 11, fontWeight: 700,
        color: '#95d5b2', letterSpacing: 1,
      }}>{wind}</div>
      <div style={{ fontSize: 10, color: '#74c69d' }}>{label}</div>
      {/* 重なった裏牌 */}
      <div style={{ position: 'relative', width: TW, height: totalH }}>
        {Array.from({ length: count }, (_, i) => (
          <div key={i} style={{ position: 'absolute', top: i * STEP, left: 0, zIndex: i }}>
            <FaceDownTile w={TW} h={TH} />
          </div>
        ))}
      </div>
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{count}枚</div>
    </div>
  );
}

// ── 捨て牌グリッド（6枚1行） ──────────────────────────
function DiscardGrid({ tiles }: { tiles: TileIndex[] }) {
  const rows: TileIndex[][] = [];
  for (let i = 0; i < tiles.length; i += 6) rows.push(tiles.slice(i, i + 6));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {rows.length === 0
        ? <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', lineHeight: '36px' }}>なし</span>
        : rows.map((row, ri) => (
          <div key={ri} style={{ display: 'flex', gap: 3 }}>
            {row.map((tile, ti) => <TileDisplay key={`${tile}-${ti}`} tile={tile} size="sm" />)}
          </div>
        ))
      }
    </div>
  );
}

// ── 捨て牌ゾーン（ラベル付き） ────────────────────────
function DiscardZone({
  label, wind, tiles, align,
}: { label: string; wind: string; tiles: TileIndex[]; align: 'left' | 'right' }) {
  return (
    <div style={{
      flex: 1, minWidth: 0,
      background: 'rgba(0,0,0,0.2)',
      borderRadius: 8,
      padding: '8px 10px',
      border: '1px solid rgba(64,145,108,0.3)',
      display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        justifyContent: align === 'right' ? 'flex-end' : 'flex-start',
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.1)', borderRadius: 4,
          padding: '1px 7px', fontSize: 11, fontWeight: 700,
          color: '#95d5b2', letterSpacing: 1,
        }}>{wind}</div>
        <span style={{ fontSize: 11, color: '#74c69d' }}>{label}</span>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{tiles.length}枚</span>
      </div>
      <div style={{ display: 'flex', justifyContent: align === 'right' ? 'flex-end' : 'flex-start' }}>
        <DiscardGrid tiles={tiles} />
      </div>
    </div>
  );
}

// ── メインコンポーネント ──────────────────────────────
export const BoardView: React.FC<BoardViewProps> = ({
  hand, handRed, tsumoTile, tsumoRed,
  discard1, discard2, selfDiscards,
  doraIndicators, kitaPulled, turn, remainingCount,
  selectedHandIdx, bestDiscard, phase, onTileClick,
  windSelf, windOpp1, windOpp2,
}) => {
  // 相手の手牌枚数（常に13枚 ≒ draw=discard で均衡）
  const opp1HandCount = 13;
  const opp2HandCount = 13;

  return (
    <div style={{
      background: 'linear-gradient(160deg, #1b4332 0%, #2d6a4f 60%, #1b4332 100%)',
      borderRadius: 14,
      padding: '14px 12px 16px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
      border: '3px solid #40916c',
    }}>

      {/* ══ メインテーブル ═════════════════════════════════ */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>

        {/* ── 左: 上家の手牌（裏向き） ── */}
        <OpponentHand count={opp1HandCount} wind={windOpp1} label="上家" />

        {/* ── 中央テーブル ── */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>

          {/* 上段: 上家捨て牌 | 中央情報 | 下家捨て牌 */}
          <div style={{ display: 'flex', gap: 8 }}>

            <DiscardZone label="上家" wind={windOpp1} tiles={discard1} align="left" />

            {/* 中央情報 */}
            <div style={{
              width: 118, flexShrink: 0,
              display: 'flex', flexDirection: 'column', gap: 7,
              alignItems: 'center', justifyContent: 'center',
            }}>
              {/* ドラ表示牌 */}
              <div style={{
                background: 'rgba(0,0,0,0.4)', borderRadius: 8,
                padding: '7px 8px', textAlign: 'center', width: '100%',
                border: '1px solid rgba(243,156,18,0.35)',
              }}>
                <div style={{ fontSize: 9, color: '#f39c12', fontWeight: 600, marginBottom: 4, letterSpacing: 1 }}>
                  ▼ ドラ表示
                </div>
                <div style={{ display: 'flex', gap: 3, justifyContent: 'center', flexWrap: 'wrap' }}>
                  {doraIndicators.map((d, i) => <TileDisplay key={i} tile={d} size="sm" />)}
                </div>
                <div style={{ marginTop: 5, fontSize: 9, color: 'rgba(255,255,255,0.35)' }}>
                  ドラ:{' '}
                  <span style={{ color: '#f39c12', fontWeight: 700 }}>
                    {doraIndicators.map(d => {
                      const dora = doraFromIndicator(d);
                      return String.fromCodePoint(
                        dora < 9  ? 0x1F007 + dora
                        : dora < 18 ? 0x1F019 + (dora - 9)
                        : dora < 27 ? 0x1F010 + (dora - 18)
                        : [0x1F000,0x1F001,0x1F002,0x1F003,0x1F006,0x1F005,0x1F004][dora-27]
                      );
                    }).join(' ')}
                  </span>
                </div>
              </div>

              {/* 残り枚数・巡目 */}
              <div style={{
                background: 'rgba(0,0,0,0.35)', borderRadius: 8,
                padding: '7px 8px', textAlign: 'center', width: '100%',
              }}>
                <div style={{ fontSize: 9, color: '#95d5b2', marginBottom: 1 }}>残り枚数</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                  {remainingCount}
                </div>
                <div style={{ fontSize: 9, color: '#74c69d', marginTop: 3 }}>
                  東1局 第{turn}巡
                </div>
              </div>

              {/* 北抜き */}
              {kitaPulled > 0 && (
                <div style={{
                  background: 'rgba(142,68,173,0.3)', borderRadius: 6,
                  padding: '4px 6px', textAlign: 'center', width: '100%',
                  fontSize: 10, color: '#bb86fc',
                  border: '1px solid rgba(142,68,173,0.4)',
                }}>
                  🀃 北抜き {kitaPulled}枚
                </div>
              )}
            </div>

            <DiscardZone label="下家" wind={windOpp2} tiles={discard2} align="right" />
          </div>

          {/* 中段: 自分の捨て牌 */}
          <div style={{
            background: 'rgba(0,0,0,0.2)', borderRadius: 8,
            padding: '8px 10px', border: '1px solid rgba(64,145,108,0.25)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <div style={{
                background: 'rgba(255,255,255,0.1)', borderRadius: 4,
                padding: '1px 7px', fontSize: 11, fontWeight: 700,
                color: '#95d5b2', letterSpacing: 1,
              }}>{windSelf}</div>
              <span style={{ fontSize: 11, color: '#74c69d' }}>自分の捨て牌</span>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginLeft: 'auto' }}>
                {selfDiscards.length}枚
              </span>
            </div>
            <DiscardGrid tiles={selfDiscards} />
          </div>
        </div>

        {/* ── 右: 下家の手牌（裏向き） ── */}
        <OpponentHand count={opp2HandCount} wind={windOpp2} label="下家" />
      </div>

      {/* ══ 自分の手牌 ═══════════════════════════════════ */}
      <div style={{
        marginTop: 12,
        background: 'rgba(0,0,0,0.25)', borderRadius: 8,
        padding: '10px 12px 10px',
        border: '1px solid rgba(64,145,108,0.3)',
      }}>
        <div style={{ fontSize: 11, color: '#74c69d', marginBottom: 8 }}>
          <span style={{
            background: 'rgba(255,255,255,0.1)', borderRadius: 4,
            padding: '1px 7px', fontSize: 11, fontWeight: 700,
            color: '#95d5b2', letterSpacing: 1, marginRight: 6,
          }}>{windSelf}</span>
          自分の手牌
          {phase === 'deal' && (
            <span style={{ marginLeft: 10, color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>
              切りたい牌をクリック
            </span>
          )}
        </div>
        <HandView
          hand={hand}
          handRed={handRed}
          tsumoTile={tsumoTile}
          tsumoRed={tsumoRed}
          selectedHandIdx={selectedHandIdx}
          bestDiscard={bestDiscard}
          phase={phase}
          onTileClick={onTileClick}
        />
      </div>
    </div>
  );
};
