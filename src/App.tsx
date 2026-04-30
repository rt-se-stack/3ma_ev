import { useState, useCallback, useMemo } from 'react';
import type { TileIndex, DiscardAnalysis } from './types/mahjong';
import { toCounts, calcRemainingFromBoard } from './logic/tiles';
import { analyzeHand, calcShanten } from './logic/analyzer';
import { generateBoard } from './logic/simulator';
import type { SimulatedBoard } from './logic/simulator';
import { BoardView } from './components/BoardView';
import { AnalysisPanel } from './components/AnalysisPanel';
import { TileDisplay } from './components/TileDisplay';

type Phase = 'playing' | 'selected' | 'analyzed';

interface AppState {
  board: SimulatedBoard;
  phase: Phase;
  selectedHandIdx: number | null;
  selectedDiscard: TileIndex | null;
  analysis: DiscardAnalysis[];
}

function newState(): AppState {
  return {
    board: generateBoard(),
    phase: 'playing',
    selectedHandIdx: null,
    selectedDiscard: null,
    analysis: [],
  };
}

export default function App() {
  const [state, setState] = useState<AppState>(newState);

  // ── Derived values ─────────────────────────────
  const { board } = state;
  const allTiles = useMemo(
    () => [...board.hand, board.tsumoTile],
    [board.hand, board.tsumoTile],
  );
  const counts = useMemo(() => toCounts(allTiles), [allTiles]);
  // 山牌残り枚数 = 初期山牌(55) − 全員の捨て牌枚数 − 1(現在のツモ)
  // 内訳: 108枚 − 王牌14枚 − 3人×13枚配牌 = 55枚
  // 各自の捨て牌枚数 = 過去にツモった回数、+1 は今回のツモ分
  const remainingCount = useMemo(() =>
    Math.max(0, 55 - board.discard1.length - board.discard2.length - board.selfDiscards.length - 1),
    [board.discard1, board.discard2, board.selfDiscards],
  );
  const currentShanten = useMemo(() => calcShanten(counts), [counts]);
  const bestDiscard = state.analysis[0]?.discard ?? null;

  // ── Handlers ───────────────────────────────────
  const handleNewGame = useCallback(() => setState(newState()), []);

  // handIdx: 0..11 = hand, -1 = tsumo
  const handleTileClick = useCallback((tile: TileIndex, handIdx: number) => {
    setState(prev => {
      if (prev.phase === 'analyzed') return prev;
      // 同じ牌を再クリック → 確定して分析
      if (prev.selectedHandIdx === handIdx && prev.phase === 'selected') {
        const { board } = prev;
        const tiles = [...board.hand, board.tsumoTile];
        const cnt = toCounts(tiles);
        const rem = calcRemainingFromBoard(
          board.hand, board.tsumoTile,
          board.discard1, board.discard2,
          board.doraIndicators, board.kitaPulled,
          board.selfDiscards,
        );
        const analysis = analyzeHand(tiles, cnt, rem, board.doraIndicators, board.kitaPulled);
        return { ...prev, phase: 'analyzed', analysis };
      }
      // 初クリック or 別の牌 → 選択
      return { ...prev, phase: 'selected', selectedHandIdx: handIdx, selectedDiscard: tile };
    });
  }, []);

  const handleConfirm = useCallback(() => {
    setState(prev => {
      if (prev.selectedDiscard === null) return prev;
      const { board } = prev;
      const tiles = [...board.hand, board.tsumoTile];
      const cnt = toCounts(tiles);
      const rem = calcRemainingFromBoard(
        board.hand, board.tsumoTile,
        board.discard1, board.discard2,
        board.doraIndicators, board.kitaPulled,
        board.selfDiscards,
      );
      const analysis = analyzeHand(tiles, cnt, rem, board.doraIndicators, board.kitaPulled);
      return { ...prev, phase: 'analyzed', analysis };
    });
  }, []);


  const handleReset = useCallback(() => {
    setState(prev => ({
      ...prev,
      phase: 'playing',
      selectedHandIdx: null,
      selectedDiscard: null,
      analysis: [],
    }));
  }, []);

  // HandView に渡す phase
  const hvPhase: 'deal' | 'select' | 'result' =
    state.phase === 'analyzed' ? 'result'
    : state.phase === 'selected' ? 'select'
    : 'deal';

  return (
    <div style={{
      minHeight: '100vh',
      background: '#111c27',
      color: '#ecf0f1',
      fontFamily: '"Noto Sans JP", "Hiragino Kaku Gothic Pro", "Yu Gothic UI", sans-serif',
    }}>
      {/* Header */}
      <div style={{
        background: '#0a1520',
        padding: '10px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 10px rgba(0,0,0,0.5)',
        borderBottom: '1px solid #1e3a5f',
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#f39c12' }}>
            🀄 三麻シミュレーター
          </h1>
          <p style={{ margin: 0, fontSize: 11, color: '#5d7a8a' }}>
            雀魂ルール（北抜きあり）· シャンテン数 / 受け入れ枚数 / EV分析
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{
            fontSize: 13,
            color: currentShanten <= 0 ? '#2ecc71' : '#e74c3c',
            fontWeight: 700,
          }}>
            {currentShanten === -1 ? '完成' : currentShanten === 0 ? '聴牌' : `${currentShanten}向聴`}
          </span>
          <button onClick={handleNewGame} style={{
            padding: '8px 18px',
            background: '#27ae60',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
          }}>
            🎲 新しい問題
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '16px 14px' }}>

        {/* ── Board ── */}
        <BoardView
          hand={board.hand}
          handRed={board.handRed}
          tsumoTile={board.tsumoTile}
          tsumoRed={board.tsumoRed}
          discard1={board.discard1}
          discard2={board.discard2}
          selfDiscards={board.selfDiscards}
          doraIndicators={board.doraIndicators}
          kitaPulled={board.kitaPulled}
          turn={board.turn}
          remainingCount={remainingCount}
          selectedHandIdx={state.selectedHandIdx}
          bestDiscard={state.phase === 'analyzed' ? bestDiscard : null}
          phase={hvPhase}
          onTileClick={handleTileClick}
          windSelf={board.windSelf}
          windOpp1={board.windOpp1}
          windOpp2={board.windOpp2}
        />

        {/* ── Selected tile confirm ── */}
        {state.phase === 'selected' && state.selectedDiscard !== null && (
          <div style={{
            marginTop: 12,
            display: 'flex',
            justifyContent: 'center',
            gap: 12,
            alignItems: 'center',
          }}>
            <span style={{ fontSize: 14, color: '#ecf0f1' }}>
              選択中:
            </span>
            <TileDisplay tile={state.selectedDiscard} size="md" selected />
            <button onClick={handleConfirm} style={{
              padding: '10px 28px',
              background: '#e67e22',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
            }}>
              この牌を切る → 分析
            </button>
            <button onClick={handleReset} style={{
              padding: '10px 16px',
              background: '#555',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 13,
              cursor: 'pointer',
            }}>
              キャンセル
            </button>
          </div>
        )}

        {/* ── Analysis Panel ── */}
        {state.phase === 'analyzed' && state.analysis.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <div style={{
              background: '#fff',
              borderRadius: 12,
              padding: '18px 16px',
              color: '#2c3e50',
              boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
            }}>
              <AnalysisPanel
                analysis={state.analysis}
                userDiscard={state.selectedDiscard}
                handCounts={counts}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
              <button onClick={handleReset} style={{
                padding: '8px 18px',
                background: '#2980b9',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontSize: 13,
                cursor: 'pointer',
              }}>
                同じ盤面でやり直す
              </button>
              <button onClick={handleNewGame} style={{
                padding: '8px 18px',
                background: '#27ae60',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
              }}>
                🎲 新しい問題
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
