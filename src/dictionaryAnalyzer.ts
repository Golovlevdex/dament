// dictionaryAnalyzer.ts
// Анализатор связей и пересечений букв в словаре
// Позволяет анализировать словарь и сохранять статистику в отдельный JSON

import * as fs from "fs";

// Тип словаря: { "А": ["АПЕЛЬСИН", ...], ... }
export type GameDictionary = Record<string, string[]>;

// Статистика по буквам: сколько раз каждая буква встречается в словах
export interface LetterStats {
  [letter: string]: number;
}

// Связи между словами: какие слова имеют общие буквы
export interface WordConnections {
  [word: string]: string[]; // список связанных слов
}

// Главная функция анализа
export function analyzeDictionary(dictionary: GameDictionary) {
  const letterStats: LetterStats = {};
  const wordConnections: WordConnections = {};
  const allWords: string[] = Object.values(dictionary).flat();

  // Считаем статистику по буквам
  for (const word of allWords) {
    for (const letter of word) {
      letterStats[letter] = (letterStats[letter] || 0) + 1;
    }
  }

  // Строим связи между словами
  for (const word of allWords) {
    const connections: string[] = [];
    const wordLetters = new Set(word);
    for (const other of allWords) {
      if (word === other) continue;
      for (const letter of other) {
        if (wordLetters.has(letter)) {
          connections.push(other);
          break;
        }
      }
    }
    wordConnections[word] = connections;
  }

  return { letterStats, wordConnections };
}

// Сохранить результат анализа в JSON
export function saveAnalysisToFile(analysis: any, filePath: string) {
  fs.writeFileSync(filePath, JSON.stringify(analysis, null, 2), "utf-8");
}

// Пример использования:
// import { gameDictionary } from "./dictionary";
// const analysis = analyzeDictionary(gameDictionary);
// saveAnalysisToFile(analysis, "dictionary-analysis.json");
