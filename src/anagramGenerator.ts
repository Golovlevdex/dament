// Типы для бонусов и клетки
export type BonusType = 'none' | 'doubleLetter' | 'rareBonus';
export interface Cell {
  letter: string;
  bonus: BonusType;
}
// Генератор тем и анаграмм для игры

export type Theme = {
  name: string;
  reward: string;
  words: string[];
};
// Общий словарь для генерации анаграмм вне темы
export const mainDictionary: string[] = [
  "дом", "река", "машина", "стол", "окно", "книга", "ручка", "город", "улица", "школа"
  // ...добавьте слова
];

// Получить случайное слово из общего словаря
export function getRandomWordFromDictionary(): string {
  const idx = Math.floor(Math.random() * mainDictionary.length);
  return mainDictionary[idx];
}

// Проверить, разрешено ли слово в текущей теме
export function isWordAllowedInTheme(word: string, theme: Theme): boolean {
  return theme.words.includes(word);
}

// Добавить слово в тему
export function addWordToTheme(word: string, theme: Theme): void {
  if (!theme.words.includes(word)) {
    theme.words.push(word);
  }
}

// Удалить слово из темы
export function removeWordFromTheme(word: string, theme: Theme): void {
  theme.words = theme.words.filter(w => w !== word);
}

// Загрузка бонусов для букв из letter-bonuses.json
import bonusesJson from './letter-bonuses.json';
export const letterBonuses: Record<string, number> = bonusesJson;

// Генерация игрового поля 4x4 с бонусами из letter-bonuses.json
export function generateBoard(theme?: Theme): Cell[][] {
  const size = 4;
  let letters: string[] = [];
  if (theme) {
    theme.words.forEach(word => {
      letters.push(...word.split(""));
    });
  } else {
    mainDictionary.forEach(word => {
      letters.push(...word.split(""));
    });
  }
  letters = letters.sort(() => Math.random() - 0.5);
  const board: Cell[][] = [];
  let idx = 0;
  for (let i = 0; i < size; i++) {
    const row: Cell[] = [];
    for (let j = 0; j < size; j++) {
      const letter = letters[idx] || String.fromCharCode(1072 + Math.floor(Math.random() * 32));
      row.push({
        letter,
        bonus: 'none' // устаревшее поле, не используется
      });
      idx++;
    }
    board.push(row);
  }
  return board;
}

// Проверка, можно ли составить слово на поле (по соседним буквам)
export function canFormWordOnBoard(word: string, board: Cell[][]): boolean {
  const size = board.length;
  const visited: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
  const upperWord = word.toUpperCase();

  function dfs(x: number, y: number, idx: number): boolean {
    if (idx === upperWord.length) return true;
    if (x < 0 || y < 0 || x >= size || y >= size) return false;
    if (visited[x][y]) return false;
    if (board[x][y].letter.toUpperCase() !== upperWord[idx]) return false;
    visited[x][y] = true;
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (dx !== 0 || dy !== 0) {
          if (dfs(x + dx, y + dy, idx + 1)) {
            visited[x][y] = false;
            return true;
          }
        }
      }
    }
    visited[x][y] = false;
    return false;
  }

  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      if (dfs(i, j, 0)) return true;
    }
  }
  return false;
}

// Найти все разрешённые слова, которые реально можно составить на поле
export function findAllWordsOnBoard(board: Cell[][], theme?: Theme): string[] {
  // Используем новый расширенный словарь вместо старого mainDictionary
  const { gameDictionary } = require('./dictionary');
  const words = theme ? theme.words : gameDictionary;
  return words
    .filter((word: string) => word.length >= 3) // только слова от 3 букв
    .filter((word: string) => canFormWordOnBoard(word.toUpperCase(), board));
}

// Найти маршруты (пути по клеткам) для всех найденных слов на поле
import { CellPosition, WordRoute } from "./intersectionAnalyzer";

/**
 * Возвращает маршруты для всех слов, которые реально можно составить на поле
 * @param board игровое поле
 * @param theme тема (опционально)
 * @returns массив маршрутов (WordRoute[]), каждый маршрут — массив позиций клеток
 */
export function findWordRoutesOnBoard(board: Cell[][], theme?: Theme): WordRoute[] {
  const { gameDictionary } = require('./dictionary');
  const words = theme ? theme.words : gameDictionary;
  const result: WordRoute[] = [];
  for (const word of words) {
    if (word.length < 3) continue;
    const route = getWordRouteOnBoard(word.toUpperCase(), board);
    if (route) result.push(route);
  }
  return result;
}

/**
 * Возвращает маршрут (массив позиций) для слова, если оно реально может быть составлено на поле
 * @param word слово
 * @param board игровое поле
 * @returns маршрут (WordRoute) или null
 */
function getWordRouteOnBoard(word: string, board: Cell[][]): WordRoute | null {
  // Поиск по всем возможным путям (DFS)
  const rows = board.length;
  const cols = board[0].length;
  const visited: boolean[][] = Array.from({ length: rows }, () => Array(cols).fill(false));
  let foundRoute: WordRoute | null = null;

  function dfs(r: number, c: number, idx: number, route: WordRoute): boolean {
    if (idx === word.length) {
      foundRoute = [...route];
      return true;
    }
    if (
      r < 0 || r >= rows ||
      c < 0 || c >= cols ||
      visited[r][c] ||
      board[r][c].letter !== word[idx]
    ) {
      return false;
    }
    visited[r][c] = true;
    route.push({ row: r, col: c });
    // Перебираем соседей (8 направлений)
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        if (dfs(r + dr, c + dc, idx + 1, route)) {
          visited[r][c] = false;
          route.pop();
          return true;
        }
      }
    }
    visited[r][c] = false;
    route.pop();
    return false;
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c].letter === word[0]) {
        if (dfs(r, c, 0, [])) {
          return foundRoute;
        }
      }
    }
  }
  return null;
}

// Структура для хранения результата игрока
export type PlayerResult = {
  name: string;
  score: number;
  foundWords: string[];
};

// Массив результатов игроков (например, за текущий раунд)
export const playerResults: PlayerResult[] = [];

// Добавить результат игрока
export function addPlayerResult(result: PlayerResult): void {
  playerResults.push(result);
}

// Получить топ-10 игроков по очкам
export function getLeaderboard(): PlayerResult[] {
  return [...playerResults].sort((a, b) => b.score - a.score).slice(0, 10);
}

// Состояния игры
export type GameState = 'playing' | 'results';

// Основная структура текущей игры
export type GameSession = {
  state: GameState;
  timeLeft: number; // секунды
  board: Cell[][];
  theme?: Theme;
  startTime: number;
  endTime: number;
};

// Текущая игровая сессия
export let currentGame: GameSession | null = null;

// Длительность раунда и паузы (секунды)
export const ROUND_DURATION = 30; // 30 секунд
export const PAUSE_DURATION = 15;  // 15 секунд

// Запуск нового раунда
export function startNewRound(theme?: Theme) {
  const now = Date.now();
  currentGame = {
    state: 'playing',
    timeLeft: ROUND_DURATION,
    board: generateBoard(theme),
    theme,
    startTime: now,
    endTime: now + ROUND_DURATION * 1000
  };
  // Здесь можно запустить таймер (например, через setInterval в UI)
}

// Завершение раунда и переход к результатам
export function finishRound() {
  if (!currentGame) return;
  currentGame.state = 'results';
  currentGame.timeLeft = PAUSE_DURATION;
  currentGame.endTime = Date.now() + PAUSE_DURATION * 1000;
  // Здесь можно показать результаты и лидерборд
}

// Переход к следующему раунду после паузы
export function nextRound(theme?: Theme) {
  startNewRound(theme);
}

export const themes: Theme[] = [
  {
    name: "Фрукты",
    reward: "Значок Фрукты",
    words: ["яблоко", "банан", "груша", "апельсин"]
  },
  {
    name: "Животные",
    reward: "Значок Животные",
    words: ["тигр", "лев", "слон", "волк"]
  },
  // ...добавьте остальные темы
];

// Получить следующую тему по кругу
export function getNextTheme(currentIndex: number): { theme: Theme; nextIndex: number } {
  const nextIndex = (currentIndex + 1) % themes.length;
  return { theme: themes[nextIndex], nextIndex };
}

// Получить случайное слово из темы
export function getRandomWord(theme: Theme): string {
  const idx = Math.floor(Math.random() * theme.words.length);
  return theme.words[idx];
}

// Перемешать буквы в слове (анаграмма)
export function shuffleWord(word: string): string {
  return word.split("").sort(() => Math.random() - 0.5).join("");
}

// Пример использования:
// let currentThemeIndex = 0;
// let { theme, nextIndex } = getNextTheme(currentThemeIndex);
// let word = getRandomWord(theme);
// let anagram = shuffleWord(word);
// console.log(`Тема: ${theme.name}, Анаграмма: ${anagram}`);
