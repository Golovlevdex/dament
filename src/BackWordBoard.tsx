import React, { useState } from "react";
import GameBoard from "./GameBoard";
import { letterBonuses } from "./anagramGenerator";

interface BackWordBoardProps {
  word?: string; // по умолчанию "НАЗАД"
  onPathComplete: (path: Array<[number, number]>) => void;
  onDragUpdate?: (path: Array<[number, number]>) => void;
  selectedCells?: Array<[number, number]>;
  flashColor?: string | null;
}

// Генерируем "поле" из одной строки с буквами слова
import { BonusType } from "./anagramGenerator";
function makeBoard(word: string) {
  return [
    [...word].map((letter, idx) => ({
      letter,
      bonus: 'none' as BonusType,
      row: 0,
      col: idx
    }))
  ];
}


const BackWordBoard: React.FC<BackWordBoardProps> = ({
  word = "НАЗАД",
  onPathComplete,
  onDragUpdate,
  selectedCells: externalSelected = [],
  flashColor: externalFlashColor
}) => {
  const board = makeBoard(word);
  const [selectedCells, setSelectedCells] = useState<Array<[number, number]>>([]);
  const [flashColor, setFlashColor] = useState<string | null>(null);

  // Обработчик свайпа по плиткам "НАЗАД"
  const handlePathComplete = (path: Array<[number, number]>) => {
    // Проверяем, что проведены все буквы подряд слева направо
    const isFullSwipe = path.length === word.length && path.every(([r, c], idx) => r === 0 && c === idx);
    if (isFullSwipe) {
      setFlashColor('green');
      setTimeout(() => setFlashColor(null), 300);
      setSelectedCells([]);
      onPathComplete(path);
    } else {
      setFlashColor('red');
      setTimeout(() => setFlashColor(null), 300);
      setTimeout(() => setSelectedCells([]), 350);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'absolute', left: 8, top: 8, zIndex: 2 }}>
      <GameBoard
        board={board}
        selectedCells={selectedCells.length ? selectedCells : externalSelected}
        onPathComplete={handlePathComplete}
        onDragUpdate={setSelectedCells}
        flashColor={flashColor || externalFlashColor}
        columnsCount={word.length}
      />
    </div>
  );
};

export default BackWordBoard;
