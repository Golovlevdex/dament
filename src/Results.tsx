import React from "react";
import uiStrings from './ui-strings-categorized.json';

interface ResultsProps {
  foundWords: string[];
  possibleWords: string[];
  leaderboard: { name: string; score: number }[];
  usedWords: string[];
}

const Results: React.FC<ResultsProps> = ({ foundWords, possibleWords, leaderboard, usedWords }) => {
  return (
    <div style={{ marginTop: 24 }}>
      <h2>Результаты раунда</h2>
      <div>
        <strong>Найденные слова:</strong> {foundWords.join(", ") || "—"}
      </div>
      {/* Блок возможных слов убран по просьбе пользователя */}
      <div style={{ marginTop: 16 }}>
        <strong>Все слова этого раунда:</strong>
        <div style={{ marginTop: 4, padding: '8px 0', background: '#e3f2fd', borderRadius: 6, maxHeight: 120, overflowY: 'auto', fontSize: 15 }}>
          {usedWords.length > 0
            ? usedWords.map((word, idx) => (
                <span key={idx} style={{ marginRight: 8 }}>{word}</span>
              ))
            : '—'}
        </div>
      </div>
      <div style={{ marginTop: 16 }}>
        <strong>Лидерборд:</strong>
        <ol>
          {leaderboard.map((player, idx) => (
            <li key={idx}>{player.name}: {player.score}</li>
          ))}
        </ol>
      </div>
    </div>
  );
};

export default Results;
