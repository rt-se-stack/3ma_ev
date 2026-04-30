import React from 'react';
import type { TileIndex } from '../types/mahjong';
import { TilePicker } from './TilePicker';
import { TileDisplay } from './TileDisplay';
import { SANMA_VALID } from '../logic/tiles';

interface HandSetupProps {
  hand: TileIndex[];           // 12 tiles
  tsumoTile: TileIndex | null; // 1 tile
  doraIndicators: TileIndex[]; // 1-4 tiles
  onHandChange: (tile: TileIndex, delta: 1 | -1, isTsumo: boolean) => void;
  onDoraChange: (tile: TileIndex, delta: 1 | -1) => void;
  onRandomDeal: () => void;
  onNext: () => void;
}

export const HandSetup: React.FC<HandSetupProps> = ({
  hand,
  tsumoTile,
  doraIndicators,
  onHandChange,
  onDoraChange,
  onRandomDeal,
  onNext,
}) => {
  // Compute counts for tile pickers
  const handCounts = new Array(34).fill(0);
  hand.forEach(t => handCounts[t]++);

  const tsumoCounts = new Array(34).fill(0);
  if (tsumoTile !== null) tsumoCounts[tsumoTile]++;

  const doraCounts = new Array(34).fill(0);
  doraIndicators.forEach(t => doraCounts[t]++);

  // How many tiles are used across ALL pickers (for "other used" calculation)
  const allUsed = new Array(34).fill(0);
  SANMA_VALID.forEach(t => {
    allUsed[t] = handCounts[t] + tsumoCounts[t] + doraCounts[t];
  });

  const handTotal = hand.length;
  const tsumoTotal = tsumoTile !== null ? 1 : 0;
  const canProceed = handTotal === 12 && tsumoTotal === 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Random deal button */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <button onClick={onRandomDeal} style={{
          padding: '10px 24px',
          background: '#27ae60',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 700,
          cursor: 'pointer',
        }}>
          🎲 ランダム配牌
        </button>
        <span style={{ fontSize: 13, color: '#95a5a6' }}>または下のタイルを手動で選択</span>
      </div>

      {/* Current hand preview */}
      {(handTotal > 0 || tsumoTotal > 0) && (
        <div style={{
          background: '#1e3a5f',
          borderRadius: 8,
          padding: '12px 14px',
        }}>
          <div style={{ fontSize: 12, color: '#95a5a6', marginBottom: 8 }}>
            選択中の手牌 ({handTotal}/12 + ツモ {tsumoTotal}/1)
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, flexWrap: 'nowrap' }}>
            {/* Tsumo on left */}
            {tsumoTile !== null && (
              <>
                <TileDisplay tile={tsumoTile} size="md" />
                <div style={{ width: 12 }} />
              </>
            )}
            {hand.map((t, i) => (
              <TileDisplay key={i} tile={t} size="md" />
            ))}
          </div>
        </div>
      )}

      {/* Hand picker (12 tiles) */}
      <div style={{
        background: '#1a2e4a',
        borderRadius: 8,
        padding: '14px 16px',
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#ecf0f1', marginBottom: 10 }}>
          手牌 (12枚)
          <span style={{ fontSize: 11, color: '#95a5a6', marginLeft: 8 }}>
            {handTotal}/12
          </span>
        </div>
        <TilePicker
          selected={handCounts}
          otherUsed={(() => {
            const o = [...allUsed];
            hand.forEach(t => o[t]--); // exclude hand from "other"
            return o;
          })()}
          onChange={(t, d) => onHandChange(t, d, false)}
          maxTotal={12}
          currentTotal={handTotal}
        />
      </div>

      {/* Tsumo picker (1 tile) */}
      <div style={{
        background: '#1a2e4a',
        borderRadius: 8,
        padding: '14px 16px',
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#ecf0f1', marginBottom: 10 }}>
          ツモ牌 (1枚)
          <span style={{ fontSize: 11, color: '#95a5a6', marginLeft: 8 }}>
            {tsumoTotal}/1
          </span>
        </div>
        <TilePicker
          selected={tsumoCounts}
          otherUsed={(() => {
            const o = [...allUsed];
            if (tsumoTile !== null) o[tsumoTile]--; // exclude tsumo from "other"
            return o;
          })()}
          onChange={(t, d) => onHandChange(t, d, true)}
          maxTotal={1}
          currentTotal={tsumoTotal}
          compact
        />
      </div>

      {/* Dora indicators */}
      <div style={{
        background: '#1a2e4a',
        borderRadius: 8,
        padding: '14px 16px',
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#ecf0f1', marginBottom: 6 }}>
          ドラ表示牌
          <span style={{ fontSize: 11, color: '#95a5a6', marginLeft: 8 }}>
            {doraIndicators.length}枚
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          {doraIndicators.map((t, i) => (
            <TileDisplay key={i} tile={t} size="sm" />
          ))}
        </div>
        <TilePicker
          selected={doraCounts}
          otherUsed={(() => {
            const o = [...allUsed];
            doraIndicators.forEach(t => o[t]--);
            return o;
          })()}
          onChange={onDoraChange}
          compact
        />
      </div>

      {/* Next button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={onNext}
          disabled={!canProceed}
          style={{
            padding: '10px 28px',
            background: canProceed ? '#2980b9' : '#555',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 700,
            cursor: canProceed ? 'pointer' : 'not-allowed',
          }}
        >
          次へ: 盤面入力 →
        </button>
      </div>
    </div>
  );
};
