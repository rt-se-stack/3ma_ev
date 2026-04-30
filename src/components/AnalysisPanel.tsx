import React, { useState } from 'react';
import type { DiscardAnalysis } from '../types/mahjong';
import { TileDisplay } from './TileDisplay';
import { tileName, KITA } from '../logic/tiles';
import { calcShanten } from '../logic/analyzer';

interface AnalysisPanelProps {
  analysis: DiscardAnalysis[];
  userDiscard: number | null;
  handCounts: number[];
}

const EVBar: React.FC<{ value: number; max: number; color: string }> = ({ value, max, color }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
    <div style={{
      flex: 1,
      height: 8,
      background: '#eee',
      borderRadius: 4,
      overflow: 'hidden',
    }}>
      <div style={{
        width: `${(value / max) * 100}%`,
        height: '100%',
        background: color,
        borderRadius: 4,
        transition: 'width 0.4s ease',
      }} />
    </div>
    <span style={{ fontSize: 12, color: '#555', minWidth: 28, textAlign: 'right' }}>{value}</span>
  </div>
);

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({
  analysis,
  userDiscard,
  handCounts,
}) => {
  const [expanded, setExpanded] = useState<number | null>(0);

  if (analysis.length === 0) return null;

  const best = analysis[0];
  const userRank = userDiscard !== null
    ? analysis.findIndex(a => a.discard === userDiscard) + 1
    : null;

  const currentShanten = calcShanten(handCounts);
  const maxUkeire = Math.max(...analysis.map(a => a.ukeireCount), 1);

  const isCorrect = userDiscard === best.discard;
  const isNearlyCorrect = userRank !== null && userRank <= 3;

  return (
    <div style={{ width: '100%', maxWidth: 720, margin: '0 auto' }}>

      {/* ── Verdict ── */}
      {userDiscard !== null && (
        <div style={{
          padding: '14px 20px',
          borderRadius: 10,
          marginBottom: 16,
          background: isCorrect ? '#e8f5e9' : isNearlyCorrect ? '#fff8e1' : '#fce4ec',
          border: `2px solid ${isCorrect ? '#4caf50' : isNearlyCorrect ? '#ffc107' : '#ef5350'}`,
        }}>
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
            {isCorrect ? '✅ 正解！最善手です' : isNearlyCorrect ? `🔶 惜しい！(第${userRank}位)` : `❌ 再考の余地あり (第${userRank}位)`}
          </div>
          {!isCorrect && (
            <div style={{ fontSize: 14, color: '#555' }}>
              最善手: <strong>{tileName(best.discard)}</strong>
              　受け入れ枚数: <strong>{best.ukeireCount}枚</strong>
              　EV: <strong>{best.ev}</strong>
            </div>
          )}
        </div>
      )}

      {/* ── Current hand info ── */}
      <div style={{
        display: 'flex',
        gap: 12,
        marginBottom: 16,
        padding: '10px 16px',
        background: '#f5f5f5',
        borderRadius: 8,
        fontSize: 13,
        flexWrap: 'wrap',
      }}>
        <span>現在の向聴数: <strong style={{ color: currentShanten <= 0 ? '#2ecc71' : '#e74c3c' }}>
          {currentShanten === -1 ? '完成' : currentShanten === 0 ? '聴牌' : `${currentShanten}向聴`}
        </strong></span>
        <span>最大受け入れ: <strong>{maxUkeire}枚</strong></span>
        <span style={{ color: '#888' }}>※配牌時点での分析</span>
      </div>

      {/* ── Acceptable tiles for best discard ── */}
      {best.acceptableTiles.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: '#2c3e50' }}>
            最善手「{tileName(best.discard)}」切り後の有効牌 ({best.acceptableTiles.length}種 {best.ukeireCount}枚)
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {best.acceptableTiles.map(t => (
              <TileDisplay key={t} tile={t} size="sm" showName highlighted />
            ))}
          </div>
        </div>
      )}

      {/* ── Full ranking table ── */}
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: '#2c3e50' }}>
        全切り候補ランキング
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {analysis.map((a, rank) => {
          const isUser = userDiscard === a.discard;
          const isBest = rank === 0;
          const isOpen = expanded === rank;

          const rowBg = isUser && isBest
            ? '#e8f5e9'
            : isUser
            ? '#fff8e1'
            : isBest
            ? '#f0f9ff'
            : '#fff';

          const borderColor = isUser && isBest
            ? '#4caf50'
            : isUser
            ? '#ffc107'
            : isBest
            ? '#2196f3'
            : '#e0e0e0';

          return (
            <div
              key={a.discard}
              style={{
                background: rowBg,
                border: `1px solid ${borderColor}`,
                borderRadius: 8,
                overflow: 'hidden',
                cursor: 'pointer',
              }}
              onClick={() => setExpanded(isOpen ? null : rank)}
            >
              {/* Row summary */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 12px',
                flexWrap: 'wrap',
              }}>
                {/* Rank badge */}
                <div style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: isBest ? '#2196f3' : '#bbb',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 700,
                  flexShrink: 0,
                }}>
                  {rank + 1}
                </div>

                {/* Tile */}
                <TileDisplay tile={a.discard} size="sm" />

                {/* Tile name */}
                <span style={{ fontWeight: 600, minWidth: 30, color: a.discard === KITA ? '#9b59b6' : '#2c3e50' }}>
                  {tileName(a.discard)}
                  {a.discard === KITA && ' (北抜き推奨)'}
                </span>

                {/* Labels */}
                {isUser && <span style={{ fontSize: 11, padding: '2px 6px', background: '#ffc107', color: '#333', borderRadius: 4 }}>あなた</span>}
                {isBest && !isUser && <span style={{ fontSize: 11, padding: '2px 6px', background: '#2196f3', color: '#fff', borderRadius: 4 }}>最善</span>}

                {/* Stats */}
                <div style={{ display: 'flex', gap: 16, marginLeft: 'auto', flexWrap: 'wrap' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: '#888' }}>向聴</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: a.shantenAfter <= 0 ? '#2ecc71' : '#2c3e50' }}>
                      {a.shantenAfter === -1 ? '完成' : a.shantenAfter === 0 ? '聴牌' : `${a.shantenAfter}向`}
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: '#888' }}>受け入れ</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: a.ukeireCount >= maxUkeire * 0.8 ? '#e67e22' : '#2c3e50' }}>
                      {a.ukeireCount}枚
                    </div>
                  </div>
                  <div style={{ textAlign: 'center', minWidth: 80 }}>
                    <div style={{ fontSize: 10, color: '#888' }}>EV</div>
                    <EVBar value={a.ev} max={100} color={isBest ? '#2196f3' : '#bbb'} />
                  </div>
                </div>

                <span style={{ fontSize: 12, color: '#aaa', marginLeft: 4 }}>{isOpen ? '▲' : '▼'}</span>
              </div>

              {/* Expanded detail */}
              {isOpen && (
                <div style={{
                  borderTop: '1px solid #eee',
                  padding: '10px 12px',
                  background: 'rgba(255,255,255,0.7)',
                }}>
                  {a.reasons.map((r, i) => (
                    <div key={i} style={{ fontSize: 13, color: '#444', marginBottom: 4, paddingLeft: 8, borderLeft: '3px solid #ccc' }}>
                      {r}
                    </div>
                  ))}
                  {a.acceptableTiles.length > 0 && (
                    <div style={{ marginTop: 8, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {a.acceptableTiles.map(t => (
                        <TileDisplay key={t} tile={t} size="sm" showName />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
