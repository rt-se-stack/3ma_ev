import React from 'react';
import type { TileIndex } from '../types/mahjong';
import { tileChar, tileName, tileSuit } from '../logic/tiles';

interface TileDisplayProps {
  tile: TileIndex;
  isRed?: boolean;
  selected?: boolean;
  highlighted?: boolean;
  dimmed?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
}

const SUIT_COLOR: Record<string, string> = {
  man: '#c0392b',
  pin: '#2980b9',
  sou: '#27ae60',
  honor: '#8e44ad',
};

export const TileDisplay: React.FC<TileDisplayProps> = ({
  tile,
  isRed = false,
  selected = false,
  highlighted = false,
  dimmed = false,
  onClick,
  size = 'md',
  showName = false,
}) => {
  const suit = tileSuit(tile);
  const color = isRed ? '#e74c3c' : SUIT_COLOR[suit];

  const sizeMap = {
    sm: { width: 36, height: 50, font: 28, nameFont: 10 },
    md: { width: 50, height: 68, font: 40, nameFont: 11 },
    lg: { width: 62, height: 84, font: 50, nameFont: 12 },
  };
  const s = sizeMap[size];

  const containerStyle: React.CSSProperties = {
    display: 'inline-flex',
    flexDirection: 'column',
    alignItems: 'center',
    cursor: onClick ? 'pointer' : 'default',
    userSelect: 'none',
    transition: 'transform 0.15s, box-shadow 0.15s',
    transform: selected ? 'translateY(-12px)' : highlighted ? 'translateY(-4px)' : 'none',
    opacity: dimmed ? 0.4 : 1,
    gap: 2,
  };

  const tileStyle: React.CSSProperties = {
    width: s.width,
    height: s.height,
    background: selected
      ? 'linear-gradient(145deg, #fff9e6, #fff3cc)'
      : highlighted
      ? 'linear-gradient(145deg, #e8f5e9, #c8e6c9)'
      : 'linear-gradient(145deg, #ffffff, #f0f0f0)',
    border: selected
      ? '2px solid #f39c12'
      : highlighted
      ? '2px solid #2ecc71'
      : '1px solid #bbb',
    borderRadius: 6,
    boxShadow: selected
      ? '0 6px 16px rgba(243,156,18,0.4)'
      : highlighted
      ? '0 4px 12px rgba(46,204,113,0.3)'
      : '2px 3px 6px rgba(0,0,0,0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: s.font,
    color,
    lineHeight: 1,
    position: 'relative',
  };

  return (
    <div style={containerStyle} onClick={onClick} title={tileName(tile)}>
      <div style={tileStyle}>
        {tileChar(tile)}
        {isRed && (
          <span style={{
            position: 'absolute',
            top: 2,
            right: 3,
            fontSize: 8,
            color: '#e74c3c',
            fontWeight: 'bold',
          }}>赤</span>
        )}
      </div>
      {showName && (
        <span style={{ fontSize: s.nameFont, color: '#555', fontWeight: 500 }}>
          {tileName(tile)}
        </span>
      )}
    </div>
  );
};
