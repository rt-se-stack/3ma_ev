import React from 'react';
import type { TileIndex } from '../types/mahjong';
import { tileChar, tileName, TILE_GROUPS } from '../logic/tiles';

interface TilePickerProps {
  /** How many of each tile are currently selected in THIS picker */
  selected: number[];        // length 34
  /** How many of each tile are used globally (in other pickers/hand) */
  otherUsed: number[];       // length 34
  onChange: (tile: TileIndex, delta: 1 | -1) => void;
  /** Max total tiles selectable in this picker (e.g. 13 for hand, unlimited for discards) */
  maxTotal?: number;
  currentTotal?: number;
  compact?: boolean;
}

export const TilePicker: React.FC<TilePickerProps> = ({
  selected,
  otherUsed,
  onChange,
  maxTotal,
  currentTotal = 0,
  compact = false,
}) => {
  const tileSize = compact ? 36 : 44;
  const fontSize = compact ? 26 : 32;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? 4 : 6 }}>
      {TILE_GROUPS.map(group => (
        <div key={group.label} style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
          <span style={{
            fontSize: 11, color: '#888', minWidth: 28, textAlign: 'right', flexShrink: 0,
          }}>{group.label}</span>
          {group.tiles.map(tile => {
            const count = selected[tile] ?? 0;
            const maxAvail = 4 - (otherUsed[tile] ?? 0);
            const canAdd = count < maxAvail && (maxTotal === undefined || currentTotal < maxTotal);
            const canRemove = count > 0;

            return (
              <div key={tile} style={{ position: 'relative', display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
                {/* Tile button */}
                <button
                  onClick={() => canAdd && onChange(tile, 1)}
                  onContextMenu={e => { e.preventDefault(); canRemove && onChange(tile, -1); }}
                  style={{
                    width: tileSize,
                    height: tileSize * 1.35,
                    background: count > 0
                      ? 'linear-gradient(145deg,#fff9e6,#fff3cc)'
                      : maxAvail === 0
                      ? '#2a2a2a'
                      : 'linear-gradient(145deg,#ffffff,#f0f0f0)',
                    border: count > 0 ? '2px solid #f39c12' : '1px solid #bbb',
                    borderRadius: 5,
                    cursor: canAdd ? 'pointer' : 'default',
                    fontSize,
                    lineHeight: 1,
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: maxAvail === 0 ? 0.25 : 1,
                    boxShadow: count > 0 ? '0 2px 6px rgba(243,156,18,0.3)' : '1px 2px 4px rgba(0,0,0,0.12)',
                    transition: 'all 0.1s',
                    userSelect: 'none',
                  }}
                  title={`${tileName(tile)} (右クリックで削除)`}
                >
                  {tileChar(tile)}
                </button>

                {/* Count badge */}
                {count > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: -6,
                    right: -6,
                    background: '#e67e22',
                    color: '#fff',
                    borderRadius: '50%',
                    width: 16,
                    height: 16,
                    fontSize: 10,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'none',
                  }}>{count}</div>
                )}

                {/* Max reached indicator */}
                {maxAvail === 0 && (
                  <div style={{
                    position: 'absolute',
                    bottom: 2,
                    fontSize: 8,
                    color: '#888',
                  }}>全</div>
                )}
              </div>
            );
          })}
        </div>
      ))}
      <p style={{ margin: '2px 0 0', fontSize: 11, color: '#aaa' }}>
        左クリック: 追加　右クリック: 削除
      </p>
    </div>
  );
};
