import React, { useRef, useState } from "react";
import "./GameBoard.css";

import { Cell, letterBonuses } from "./anagramGenerator";

interface GameBoardProps {
  board: Cell[][];
  selectedCells?: Array<[number, number]>;
  onCellSelect?: (row: number, col: number) => void;
  onPathComplete?: (path: Array<[number, number]>) => void;
  onDragUpdate?: (path: Array<[number, number]>) => void;
  flashColor?: string | null; // 'green' | 'red' | null
  columnsCount?: number; // для кастомного количества колонок (например, для стартового слова)
}

// ...existing code...

const GameBoard: React.FC<GameBoardProps> = ({ board, selectedCells = [], onCellSelect, onPathComplete, onDragUpdate, flashColor, columnsCount }) => {
  // Если columnsCount не передан, используем 4 (стандартное поле)
  const cols = columnsCount || 4;
  const getCoords = (idx: number) => [Math.floor(idx / cols), idx % cols] as [number, number];
  const [isDragging, setIsDragging] = useState(false);

  // Глобальный mouseup для завершения drag
  React.useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        if (dragCells.current.length > 0 && typeof onPathComplete === 'function') {
          onPathComplete([...dragCells.current]);
        }
        dragCells.current = [];
      }
    };
    document.addEventListener('mouseup', handleGlobalMouseUp);
    return () => document.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [isDragging, onPathComplete]);
  const dragCells = useRef<Array<[number, number]>>([]);

  // Начало свайпа
  const handleStart = (row: number, col: number) => {
    setIsDragging(true);
    dragCells.current = [[row, col]];
    if (onDragUpdate) onDragUpdate([...dragCells.current]);
    if (onCellSelect) onCellSelect(row, col);
  };
  // Проверка соседства
  const isNeighbor = (a: [number, number], b: [number, number]) => {
    const dr = Math.abs(a[0] - b[0]);
    const dc = Math.abs(a[1] - b[1]);
    return dr <= 1 && dc <= 1 && !(dr === 0 && dc === 0);
  };
  // Добавление ячейки при движении
  const handleEnter = (row: number, col: number) => {
    if (!isDragging) return;
    const path = dragCells.current;
    const last = path[path.length - 1];
    // Если навели на предыдущую клетку (шаг назад)
    if (path.length > 1) {
      const prev = path[path.length - 2];
      if (row === prev[0] && col === prev[1]) {
        path.pop();
        if (onDragUpdate) onDragUpdate([...path]);
        return;
      }
    }
    // Если клетка уже выбрана — игнорируем
    if (path.some(([r, c]) => r === row && c === col)) return;
    if (!isNeighbor(last, [row, col])) return;
    path.push([row, col]);
    if (onDragUpdate) onDragUpdate([...path]);
    if (onCellSelect) onCellSelect(row, col);
  };
  // Завершение свайпа
  const handleEnd = () => {
    setIsDragging(false);
    if (dragCells.current.length > 0 && typeof onPathComplete === 'function') {
      onPathComplete([...dragCells.current]);
    }
    dragCells.current = [];
  };

  return (
    <div
      className="user-select-none"
      style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 48px)`, gap: 8 }}
      onMouseUp={handleEnd}
      onTouchEnd={handleEnd}
    >
      {board.flat().map((cell, idx) => {
        const [row, col] = getCoords(idx);
        const isSelected = selectedCells.some(([r, c]) => r === row && c === col);
        let bg = '#e0e0e0';
        if (cell.bonus === 'doubleLetter') bg = '#ffe082';
        if (cell.bonus === 'rareBonus') bg = '#ce93d8';
        if (isSelected) bg = '#90caf9';
        if (isSelected && flashColor === 'green') bg = '#a5d6a7';
        if (isSelected && flashColor === 'red') bg = '#ef9a9a';
        const bonusValue = letterBonuses[cell.letter.toUpperCase()] || 0;
        return (
          <div
            key={idx}
            style={{
              width: 48,
              height: 48,
              background: bg,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
              borderRadius: 8,
              cursor: onCellSelect ? 'pointer' : 'default',
              transition: 'background 0.2s',
              boxShadow: isSelected ? '0 0 0 2px #1976d2' : undefined
            }}
            onMouseDown={e => {
              if (e.button === 0) handleStart(row, col);
            }}
            onMouseEnter={e => {
              if (isDragging) handleEnter(row, col);
            }}
            onTouchStart={() => handleStart(row, col)}
            onTouchMove={e => {
              const touch = e.touches[0];
              const target = document.elementFromPoint(touch.clientX, touch.clientY);
              if (target && (target as HTMLElement).dataset && (target as HTMLElement).dataset.idx) {
                const idx2 = parseInt((target as HTMLElement).dataset.idx!);
                const [r2, c2] = getCoords(idx2);
                handleEnter(r2, c2);
              }
            }}
            data-idx={idx}
          >
            <span>{cell.letter}</span>
            <span style={{ fontSize: 12, color: '#6d4c41' }}>{bonusValue > 0 ? bonusValue : ''}</span>
          </div>
        );
      })}
    </div>
  );
};

export default GameBoard;
