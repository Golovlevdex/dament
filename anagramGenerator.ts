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

// Генерация игрового поля 4x4
export function generateBoard(theme?: Theme): string[][] {
  const size = 4;
  let letters: string[] = [];
  if (theme) {
    // Собираем буквы из разрешённых слов темы
    theme.words.forEach(word => {
      letters.push(...word.split(""));
    });
  } else {
    // Собираем буквы из общего словаря
    mainDictionary.forEach(word => {
      letters.push(...word.split(""));
    });
  }
  // Перемешиваем буквы
  letters = letters.sort(() => Math.random() - 0.5);
  // Заполняем поле 4x4
  const board: string[][] = [];
  let idx = 0;
  for (let i = 0; i < size; i++) {
    const row: string[] = [];
    for (let j = 0; j < size; j++) {
      // Если букв не хватает, добавляем случайную букву из алфавита
      row.push(letters[idx] || String.fromCharCode(1072 + Math.floor(Math.random() * 32)));
      idx++;
    }
    board.push(row);
  }
  return board;
}

// Проверка, можно ли составить слово на поле (по соседним буквам)
function canFormWordOnBoard(word: string, board: string[][]): boolean {
  const size = board.length;
  const visited: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  function dfs(x: number, y: number, idx: number): boolean {
    if (idx === word.length) return true;
    if (x < 0 || y < 0 || x >= size || y >= size) return false;
    if (visited[x][y]) return false;
    if (board[x][y] !== word[idx]) return false;
    visited[x][y] = true;
    // Проверяем все 8 направлений
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

  // Запускаем поиск с каждой клетки
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      if (dfs(i, j, 0)) return true;
    }
  }
  return false;
}

// Найти все разрешённые слова, которые реально можно составить на поле
export function findAllWordsOnBoard(board: string[][], theme?: Theme): string[] {
  const words = theme ? theme.words : mainDictionary;
  return words.filter(word => canFormWordOnBoard(word, board));
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
  board: string[][];
  theme?: Theme;
  startTime: number;
  endTime: number;
};

// Текущая игровая сессия
export let currentGame: GameSession | null = null;

// Длительность раунда и паузы (секунды)
export const ROUND_DURATION = 120; // 2 минуты
export const PAUSE_DURATION = 40;  // 40 секунд

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
