
// Универсальный компонент для вывода списка слов (с очками или без)
// Используйте showScore и getScore, чтобы показывать очки рядом со словом
// Все стили можно менять здесь — изменения применятся везде, где используется WordList
import React from "react";

type WordListProps = {
  words: string[]; // Массив слов для вывода
  showScore?: boolean; // Показывать ли очки рядом со словом
  getScore?: (word: string) => number; // Функция для подсчёта очков за слово
  style?: React.CSSProperties; // Дополнительные стили для контейнера (опционально)
};

const WordList: React.FC<WordListProps> = ({ words, showScore = false, getScore, style }) => (
  // Контейнер для списка слов (меняйте flexDirection/gap/alignItems для управления расположением)
  <div
    style={{
      display: 'flex', // Контейнер — flex, чтобы слова шли в столбик
      flexDirection: 'column', // Слова идут друг под другом
      gap: 2, // Минимальный отступ между словами (можно менять на ваше усмотрение)
      alignItems: 'flex-start', // Выравнивание по левому краю
      ...style,
    }}
  >
    {words.map(word => (
      // Каждый элемент — отдельное слово
      <span
        key={word}
        className="word-item"
        style={{
          display: 'flex', // Для выравнивания слова и очков по горизонтали
          alignItems: 'center', // Центрирование по вертикали
          gap: 6, // Отступ между словом и очками
          fontFamily: 'inherit', // Наследовать шрифт от родителя (можно заменить на любой)
          fontSize: '1rem', // Размер шрифта (меняйте здесь)
          color: '#333', // Цвет текста и очков (меняйте здесь)
        }}
      >
        {/* Само слово */}
        <span>{word}</span>
        {/* Очки за слово (если showScore=true и передан getScore) */}
        {showScore && getScore && (
          <span>{getScore(word)}</span>
        )}
      </span>
    ))}
  </div>
);

export default WordList;
