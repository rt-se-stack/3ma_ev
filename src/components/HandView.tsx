import React from 'react';
import type { TileIndex } from '../types/mahjong';
import { TileDisplay } from './TileDisplay';

interface HandViewProps {
  hand: TileIndex[];          // 12 sorted tiles
  handRed: boolean[];
  tsumoTile: TileIndex;       // drawn tile shown separately
  tsumoRed: boolean;
  selectedHandIdx: number | null; // 0..11 = hand, -1 = tsumo
  bestDiscard: TileIndex | null;
  phase: 'deal' | 'select' | 'result';
  onTileClick: (tile: TileIndex, handIdx: number) => void;
}

export const HandView: React.FC<HandViewProps> = ({
  hand,
  handRed,
  tsumoTile,
  tsumoRed,
  selectedHandIdx,
  bestDiscard,
  phase,
  onTileClick,
}) => {
  const canClick = phase !== 'result';

  return (
    <div>
      {/* Single row: [ツモ] [gap] [12 hand tiles] */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: 5,
        flexWrap: 'nowrap',
      }}>
        {/* ツモ tile – left, slightly separated */}
        <TileDisplay
          tile={tsumoTile}
          isRed={tsumoRed}
          selected={selectedHandIdx === -1}
          highlighted={phase === 'result' && bestDiscard === tsumoTile && selectedHandIdx !== -1}
          onClick={canClick ? () => onTileClick(tsumoTile, -1) : undefined}
          size="lg"
        />

        {/* Gap between tsumo and hand */}
        <div style={{ width: 14, flexShrink: 0 }} />

        {/* 12 sorted hand tiles */}
        {hand.map((tile, i) => (
          <TileDisplay
            key={i}
            tile={tile}
            isRed={handRed[i]}
            selected={selectedHandIdx === i}
            highlighted={phase === 'result' && bestDiscard === tile && selectedHandIdx !== i}
            onClick={canClick ? () => onTileClick(tile, i) : undefined}
            size="lg"
          />
        ))}
      </div>
    </div>
  );
};
