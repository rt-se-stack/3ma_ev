import React from 'react';
import type { TileIndex } from '../types/mahjong';
import { TilePicker } from './TilePicker';
import { TileDisplay } from './TileDisplay';
import { HandView } from './HandView';


interface BoardInputProps {
  // Your hand (display only)
  hand: TileIndex[];
  handRed: boolean[];
  tsumoTile: TileIndex;
  tsumoRed: boolean;

  // Discards
  discard1: TileIndex[];   // 上家
  discard2: TileIndex[];   // 下家
  kitaPulled: number;

  // Used tile counts for picker constraints
  allUsed: number[];       // hand + tsumo + dora (length 34)

  onDiscard1Change: (tile: TileIndex, delta: 1 | -1) => void;
  onDiscard2Change: (tile: TileIndex, delta: 1 | -1) => void;
  onKitaChange: (delta: 1 | -1) => void;
  onBack: () => void;
  onAnalyze: () => void;
}

function DiscardPile({ tiles }: { tiles: TileIndex[] }) {
  if (tiles.length === 0) return <span style={{ fontSize: 12, color: '#666' }}>（なし）</span>;
  return (
    <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
      {tiles.map((t, i) => <TileDisplay key={i} tile={t} size="sm" />)}
    </div>
  );
}

export const BoardInput: React.FC<BoardInputProps> = ({
  hand, handRed, tsumoTile, tsumoRed,
  discard1, discard2, kitaPulled,
  allUsed,
  onDiscard1Change, onDiscard2Change, onKitaChange,
  onBack, onAnalyze,
}) => {
  // Count selected discards for picker
  const d1Counts = new Array(34).fill(0);
  discard1.forEach(t => d1Counts[t]++);
  const d2Counts = new Array(34).fill(0);
  discard2.forEach(t => d2Counts[t]++);

  // "Other used" for each picker = allUsed + other discard pile
  const otherUsed1 = allUsed.map((v, i) => v + d2Counts[i]);
  const otherUsed2 = allUsed.map((v, i) => v + d1Counts[i]);

  const totalVisible = hand.length + 1 + discard1.length + discard2.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Your hand (read-only) */}
      <div style={{ background: '#1e3a5f', borderRadius: 8, padding: '12px 14px' }}>
        <div style={{ fontSize: 12, color: '#95a5a6', marginBottom: 8 }}>自分の手牌</div>
        <HandView
          hand={hand}
          handRed={handRed}
          tsumoTile={tsumoTile}
          tsumoRed={tsumoRed}
          selectedHandIdx={null}
          bestDiscard={null}
          phase="result"
          onTileClick={() => {}}
        />
      </div>

      {/* 上家 discards */}
      <div style={{ background: '#1a2e4a', borderRadius: 8, padding: '14px 16px' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#ecf0f1', marginBottom: 8 }}>
          上家の捨て牌
          <span style={{ fontSize: 11, color: '#95a5a6', marginLeft: 8 }}>{discard1.length}枚</span>
        </div>
        <div style={{ marginBottom: 10 }}>
          <DiscardPile tiles={discard1} />
        </div>
        <TilePicker
          selected={d1Counts}
          otherUsed={otherUsed1}
          onChange={onDiscard1Change}
          compact
        />
      </div>

      {/* 下家 discards */}
      <div style={{ background: '#1a2e4a', borderRadius: 8, padding: '14px 16px' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#ecf0f1', marginBottom: 8 }}>
          下家の捨て牌
          <span style={{ fontSize: 11, color: '#95a5a6', marginLeft: 8 }}>{discard2.length}枚</span>
        </div>
        <div style={{ marginBottom: 10 }}>
          <DiscardPile tiles={discard2} />
        </div>
        <TilePicker
          selected={d2Counts}
          otherUsed={otherUsed2}
          onChange={onDiscard2Change}
          compact
        />
      </div>

      {/* 北抜き */}
      <div style={{
        background: '#1a2e4a',
        borderRadius: 8,
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
      }}>
        <span style={{ fontSize: 13, color: '#ecf0f1', fontWeight: 600 }}>北抜き（他家）</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => onKitaChange(-1)} disabled={kitaPulled === 0}
            style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: '#555', color: '#fff', cursor: kitaPulled > 0 ? 'pointer' : 'not-allowed', fontSize: 16 }}>
            −
          </button>
          <span style={{ fontSize: 18, fontWeight: 700, color: '#bb86fc', minWidth: 20, textAlign: 'center' }}>
            {kitaPulled}
          </span>
          <button onClick={() => onKitaChange(1)}
            style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: '#8e44ad', color: '#fff', cursor: 'pointer', fontSize: 16 }}>
            ＋
          </button>
        </div>
        <span style={{ fontSize: 12, color: '#888' }}>抜かれた枚数（北の残り枚数に影響）</span>
      </div>

      {/* Remaining tile summary */}
      <div style={{
        background: '#0f1923',
        borderRadius: 8,
        padding: '10px 14px',
        fontSize: 13,
        color: '#95a5a6',
      }}>
        可視牌合計: {totalVisible}枚
        残り推計: {108 - totalVisible - kitaPulled}枚前後
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button onClick={onBack} style={{
          padding: '10px 20px',
          background: '#555',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          fontSize: 14,
          cursor: 'pointer',
        }}>
          ← 手牌に戻る
        </button>
        <button onClick={onAnalyze} style={{
          padding: '10px 28px',
          background: '#e67e22',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 700,
          cursor: 'pointer',
        }}>
          分析する →
        </button>
      </div>
    </div>
  );
};
