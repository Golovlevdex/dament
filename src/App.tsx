import React, { useState, useEffect } from "react";
import WordList from "./WordList";
import type { Cell as CellType } from "./anagramGenerator";
import GameBoard from "./GameBoard";
import Timer from "./Timer";
import Results from "./Results";
// import BackButton from "./BackButton";
import BackWordBoard from "./BackWordBoard";
import { generateBoard, findAllWordsOnBoard, ROUND_DURATION, PAUSE_DURATION, Cell, letterBonuses } from "./anagramGenerator";
import { BonusType } from "./anagramGenerator";
import { isWordInDictionary, gameDictionary } from "./dictionary";
import uiStrings from './ui-strings-categorized.json';
import { canFormWordOnBoard } from "./anagramGenerator";

// --- API для работы с users.json ---
async function apiGetUser(name: string) {
  const res = await fetch(`/api/users/${encodeURIComponent(name)}`);
  if (!res.ok) throw new Error('not_found');
  return await res.json();
}

async function apiCreateUser(name: string) {
  const res = await fetch(`/api/users/${encodeURIComponent(name)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ totalScore: 0 })
  });
  if (!res.ok) throw new Error('create_error');
  return true;
}

async function apiUpdateUserScore(name: string, totalScore: number) {
  const res = await fetch(`/api/users/${encodeURIComponent(name)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ totalScore })
  });
  if (!res.ok) throw new Error('update_error');
  return true;
}

// ...дальнейший код компонента App без дублирующихся объявлений и мусора...
const getRandomWords = (count: number, dictionary: string[]): string[] => {
  const shuffled = [...dictionary].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

const App: React.FC = () => {
  // --- Модальное окно входа ---
  const [showLogin, setShowLogin] = useState(false);
  const [usersList, setUsersList] = useState<string[]>([]);

  // ВСЕ ХУКИ ДОЛЖНЫ БЫТЬ В САМОМ НАЧАЛЕ!
  // --- Регистрация пользователя ---
  const [showRegister, setShowRegister] = useState(false);
  const [userName, setUserName] = useState<string>("");
  const [registerInput, setRegisterInput] = useState<string>("");
  const [registerError, setRegisterError] = useState<string>("");
  // --- Статистика пользователя ---
  const [userTotalScore, setUserTotalScore] = useState<number>(0);
  // ...все useState выше...
  // --- остальные хуки useState ---

  // ...все useState выше...

  // ...все useState выше...


  // ...все useState выше...

  // Загрузка статистики пользователя через API при входе
  useEffect(() => {
    if (userName) {
      apiGetUser(userName)
        .then(user => setUserTotalScore(user.totalScore || 0))
        .catch(() => setUserTotalScore(0));
    }
  }, [userName]);

  // Функция для обновления статистики пользователя через API
  const updateUserStats = async (scoreToAdd: number) => {
    if (!userName) return;
    let prevScore = 0;
    try {
      const user = await apiGetUser(userName);
      prevScore = user.totalScore || 0;
    } catch {}
    const newScore = prevScore + scoreToAdd;
    try {
      await apiUpdateUserScore(userName, newScore);
    } catch {}
    setUserTotalScore(newScore);
  };
  const [helpSelected, setHelpSelected] = useState<Array<[number, number]>>([]);
  const [helpFlashColor, setHelpFlashColor] = useState<string | null>(null);
  const [analyzerWordCount, setAnalyzerWordCount] = useState(0);
  const [screen, setScreen] = useState<'welcome' | 'loading' | 'game' | 'help'>('welcome');
  const [startFlashColor, setStartFlashColor] = useState<string | null>(null);
  const [startSelected, setStartSelected] = useState<Array<[number, number]>>([]);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [loadingMax, setLoadingMax] = useState<number>(0);
  const [loadingTimer, setLoadingTimer] = useState<number>(5);
  const [roundData, setRoundData] = useState<{ board: Cell[][], words: string[] } | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(ROUND_DURATION);
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [score, setScore] = useState<number>(0);
  const [message, setMessage] = useState<string>("");
  const [selectedCells, setSelectedCells] = useState<Array<[number, number]>>([]);
  const [currentWord, setCurrentWord] = useState<string>("");
  const [flashColor, setFlashColor] = useState<string | null>(null);
  const [phase, setPhase] = useState<'playing' | 'results' | 'analyzer' | null>(null);

  // Обновление статистики пользователя после завершения раунда (когда phase становится 'analyzer')
  useEffect(() => {
    if (phase === 'analyzer' && userName && score > 0) {
      updateUserStats(score);
    }
    // eslint-disable-next-line
  }, [phase, userName, score]);
  
  // useRef тоже должен быть в начале!
  const startTouch = React.useRef<{y: number|null}>({y: null});

  // Для свайп-старта
  const START_WORD = 'СТАРТ';
  // Слово СТАРТ в одну горизонтальную линию (1x5)
  const startBoard: CellType[][] = [
    [...START_WORD].map((letter, idx) => ({ letter, bonus: 'none', row: 0, col: idx }))
  ];
  
  // Параметры генерации
  const FIELD_SIZE = 4; // размер поля (4x4)
  const MIN_WORDS = 15; // минимальное количество слов (снизили с 20)
  const MAX_ATTEMPTS = 500; // увеличили количество попыток

  const leaderboard = [
    { name: "Вы", score }
  ];

  // Обработка завершения пути (свайп/drag)
  const handlePathComplete = (path: Array<[number, number]>) => {
    if (!roundData) return;
    if (path.length < 3) {
      setMessage(uiStrings.ошибки.минимумБукв);
      setFlashColor('red');
      setTimeout(() => setFlashColor(null), 300);
      setTimeout(() => { setMessage(""); setSelectedCells([]); setCurrentWord(""); }, 350);
      return;
    }
    const word = path.map(([r, c]) => roundData.board[r][c].letter).join("");
    if (foundWords.includes(word)) {
      setMessage(uiStrings.ошибки.ужеВводилось);
      setFlashColor('red');
      setTimeout(() => setFlashColor(null), 300);
      setTimeout(() => { setMessage(""); setSelectedCells([]); setCurrentWord(""); }, 350);
      return;
    }
    if (!roundData.words.includes(word) || !isWordInDictionary(word)) {
      setMessage(uiStrings.ошибки.нетСлова);
      setFlashColor('red');
      setTimeout(() => setFlashColor(null), 300);
      setTimeout(() => { setMessage(""); setSelectedCells([]); setCurrentWord(""); }, 350);
      return;
    }
    // Подсчёт очков по бонусам букв
    let wordScore = 0;
    path.forEach(([r, c]) => {
      const letter = roundData.board[r][c].letter.toUpperCase();
      wordScore += letterBonuses[letter] || 0;
    });
    setScore(score + wordScore);
    setFoundWords([...foundWords, word]);
    setMessage(`+${wordScore} очков`);
    setFlashColor('green');
    setTimeout(() => setFlashColor(null), 300);
    setTimeout(() => { setMessage(""); setSelectedCells([]); setCurrentWord(""); }, 350);
  };

  // Функция для возврата на стартовый экран
  const goToWelcome = () => {
    setScreen('welcome');
    setPhase(null);
    setRoundData(null);
    setFoundWords([]);
    setScore(0);
    setMessage("");
    setSelectedCells([]);
    setCurrentWord("");
  };

  // useEffect для смены экранов во время загрузки
  useEffect(() => {
    if (screen === 'loading' && loadingTimer > 0) {
      const timer = setTimeout(() => setLoadingTimer(loadingTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else if (screen === 'loading' && loadingTimer === 0) {
      setScreen('game');
    }
  }, [screen, loadingTimer]);

  // useEffect для анимации загрузки
  useEffect(() => {
    if (screen === 'loading' && loadingProgress < loadingMax && loadingTimer > 0) {
      const step = Math.ceil(loadingMax / (loadingTimer * 20));
      const interval = setInterval(() => {
        setLoadingProgress(prev => Math.min(prev + step, loadingMax));
      }, 50);
      return () => clearInterval(interval);
    }
  }, [screen, loadingProgress, loadingMax, loadingTimer]);

  // --- ГЛАВНЫЙ ТАЙМЕР ИГРЫ И ФАЗ ---
  // Здесь реализованы все основные таймеры и переходы между фазами:
  //
  // 1. Анализатор (phase === 'analyzer')
  //    - Это пауза между раундами, когда игроку показываются все слова на поле.
  //    - Длительность этой паузы задаётся переменной PAUSE_DURATION (например, 15 секунд).
  //    - Если хотите изменить — ищите PAUSE_DURATION (см. импорт сверху).
  //
  // 2. Игра (phase === 'playing')
  //    - Это основной игровой раунд, когда игрок ищет слова.
  //    - Длительность раунда задаётся переменной ROUND_DURATION (например, 60 секунд).
  //    - Если хотите изменить — ищите ROUND_DURATION (см. импорт сверху).
  //
  // 3. Результаты (phase === 'results')
  //    - Это короткая пауза после окончания игры, когда показываются результаты.
  //    - Длительность задаётся жёстко в setTimeLeft(3) (3 секунды, можно изменить на любое число).
  //
  // После каждой фазы происходит переход к следующей с установкой нужного таймера.
  //
  // Схема переходов:
  // [Анализатор (PAUSE_DURATION сек)] → [Игра (ROUND_DURATION сек)] → [Результаты (3 сек)] → [Анализатор ...]
  //
  // Пример: если PAUSE_DURATION = 15, ROUND_DURATION = 60, то цикл такой:
  // 15 сек анализатор → 60 сек игра → 3 сек результаты → 15 сек анализатор ...
  //
  // Чтобы изменить длительность любой фазы, меняйте соответствующую переменную!
  useEffect(() => {
    // --- Фаза ИГРА ---
    if (phase === 'playing' && timeLeft > 0) {
      // Основной игровой таймер (по умолчанию 60 сек, регулируется ROUND_DURATION)
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
    if (phase === 'playing' && timeLeft === 0) {
      // Игра закончилась — переходим к результатам
      setSelectedCells([]);
      setCurrentWord("");
      setPhase('results');
      setTimeLeft(10); // <--- Длительность экрана результатов (10 сек, можно изменить)
    }
    // --- Фаза РЕЗУЛЬТАТЫ ---
    if (phase === 'results' && timeLeft > 0) {
      // Таймер результатов (короткая пауза между игрой и анализатором)
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
    if (phase === 'results' && timeLeft === 0) {
      // После результатов — генерируем новое поле и переходим к анализатору
      const words = getRandomWords(6, gameDictionary);
      const board = generateBoard({ name: "", reward: "", words });
      const allPossibleWords = findAllWordsOnBoard(board).filter(word => word.length >= 3);
      setRoundData({ board, words: allPossibleWords });
      setPhase('analyzer');
      setTimeLeft(PAUSE_DURATION); // <--- Длительность анализатора (по умолчанию 15 сек, регулируется PAUSE_DURATION)
      setAnalyzerWordCount(0); // сбрасываем счетчик для анимации
    }
    // --- Фаза АНАЛИЗАТОР ---
    if (phase === 'analyzer' && timeLeft > 0) {
      // Таймер анализатора (показывает слова перед началом игры)
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
    if (phase === 'analyzer' && timeLeft === 0) {
      // Анализатор закончился — начинаем новый игровой раунд
      setFoundWords([]);
      setPhase('playing');
      setTimeLeft(ROUND_DURATION); // <--- Длительность игры (по умолчанию 60 сек, регулируется ROUND_DURATION)
    }
  }, [timeLeft, phase]);

  // Анимация увеличения числа найденных слов на анализаторе
  useEffect(() => {
    if (phase === 'analyzer' && roundData) {
      setAnalyzerWordCount(0);
      let current = 0;
      const target = roundData.words.length;
      const duration = Math.max(800, Math.min(2000, target * 40)); // 0.8-2 сек
      const stepTime = Math.max(20, duration / (target || 1));
      const interval = setInterval(() => {
        current++;
        setAnalyzerWordCount(prev => {
          if (prev < target) return prev + 1;
          clearInterval(interval);
          return prev;
        });
        if (current >= target) {
          clearInterval(interval);
        }
      }, stepTime);
      
      return () => clearInterval(interval);
    }
  }, [phase, roundData]);

  const phoneFrameStyle: React.CSSProperties = {
    overflow: 'hidden',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    minWidth: 0,
    minHeight: 0,
    width: '100vw',
    maxWidth: 430,
    height: '100vh',
    maxHeight: 932,
    margin: '0 auto',
    borderRadius: 36,
    border: '8px solid #222',
    boxShadow: '0 0 32px #0006',
    background: '#111',
  };
  const phoneContentStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    background: '#fff',
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
    borderRadius: 28,
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    minWidth: 0,
    minHeight: 0
  };

  // Свайп-старт по слову СТАРТ
  const handleStartPath = (path: Array<[number, number]>) => {
    const word = path.map(([r, c]) => startBoard[r][c].letter).join("");
    if (word === START_WORD) {
      setStartFlashColor('green');
      setTimeout(() => {
        // Генерируем поле и слова для нового раунда
        const words = getRandomWords(6, gameDictionary);
        const board = generateBoard({ name: "", reward: "", words });
        const allPossibleWords = findAllWordsOnBoard(board).filter(word => word.length >= 3);
        setRoundData({ board, words: allPossibleWords });
        setScore(0); // сбрасываем очки
        setPhase('analyzer'); // Запускаем анализатор
        setTimeLeft(PAUSE_DURATION); // Длительность анализатора
        setAnalyzerWordCount(0);
        setStartSelected([]);
        setStartFlashColor(null);
      }, 350);
    } else {
      setStartFlashColor('red');
      setTimeout(() => {
        setStartSelected([]);
        setStartFlashColor(null);
      }, 350);
    }
    };

  // Обёртка для любого экрана внутри рамки смартфона
  const renderPhoneFrame = (content: React.ReactNode) => (
    <div style={{ background: '#222', minHeight: '100vh', minWidth: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={phoneFrameStyle}>
        <div style={phoneContentStyle}>
          {content}
        </div>
      </div>
    </div>
  );

  // Экран справки
  if (screen === 'help') {
    return renderPhoneFrame(
      <div style={{ fontFamily: 'sans-serif', padding: '4vw', width: '100%', maxWidth: 430, margin: '0 auto', textAlign: 'center', boxSizing: 'border-box', position: 'relative' }}>
        <BackWordBoard
          word="НАЗАД"
          onPathComplete={() => goToWelcome()}
        />
        <h1 style={{ fontSize: '2.2rem', margin: '2vw 0 2vw 0' }}>Фундамент</h1>
        <div style={{ fontSize: '1.2rem', margin: '6vw 0' }}>Справка будет добавлена позже.</div>
      </div>
    );
  }

  // Экран игры и анализатора
  if (phase === 'analyzer' && roundData) {
    return renderPhoneFrame(
      <div style={{ fontFamily: 'sans-serif', padding: '4vw', width: '100%', maxWidth: 430, margin: '0 auto', textAlign: 'center', position: 'relative', boxSizing: 'border-box' }}>
        <BackWordBoard
          word="НАЗАД"
          onPathComplete={() => goToWelcome()}
        />
        <h2 style={{ fontSize: '1.3rem', margin: '2vw 0 2vw 0' }}>Анализатор поля</h2>
        <div style={{ fontSize: '1.1rem', margin: '4vw 0' }}>Найдено слов: <b>{analyzerWordCount}</b></div>
        <div style={{ fontSize: '1rem', color: '#1976d2', marginBottom: '3vw' }}>До начала игры: {timeLeft} сек.</div>
        <div style={{ margin: '3vw 0', padding: '2vw', background: '#f5f5f5', borderRadius: 8, fontSize: '0.95rem', color: '#333', maxHeight: 180, overflowY: 'auto' }}>
          <b>Все слова на поле (с очками):</b>
          <WordList
            words={roundData.words
              .map(word => ({
                word,
                score: word.split('').reduce((sum, letter) => sum + (letterBonuses[letter.toUpperCase()] || 0), 0)
              }))
              .sort((a, b) => b.score - a.score)
              .slice(0, analyzerWordCount)
              .map(({ word }) => word)
            }
            showScore={true}
            getScore={word => word.split('').reduce((sum, letter) => sum + (letterBonuses[letter.toUpperCase()] || 0), 0)}
          />
        </div>
      </div>
    );
  }
  // Экран игры
  if (roundData) {
    return renderPhoneFrame(
      <div style={{ fontFamily: 'sans-serif', padding: '4vw', width: '100%', maxWidth: 430, margin: '0 auto', position: 'relative', boxSizing: 'border-box' }}>
        <BackWordBoard
          word="НАЗАД"
          onPathComplete={() => goToWelcome()}
        />
        <h1 style={{ fontSize: '2.2rem', margin: '2vw 0 2vw 0' }}>Фундамент</h1>
        <div style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '2vw' }}>
          {phase === 'playing' ? uiStrings.игра.заголовок : uiStrings.результаты.заголовок}
          {' '}
          <span style={{ fontSize: '1.1rem', fontWeight: 400, color: '#1976d2' }}>
            {timeLeft} сек.
          </span>
        </div>
        <div style={{ minHeight: 32, color: message.includes(uiStrings.прочее.очков) ? 'green' : 'red', fontWeight: 500 }}>{message}</div>
        <div style={{ marginBottom: '2vw' }}>{uiStrings.игра.очки}: {score}</div>
        <GameBoard 
          board={roundData.board} 
          selectedCells={selectedCells}
          onPathComplete={phase === 'playing' ? handlePathComplete : undefined}
          onDragUpdate={phase === 'playing' ? setSelectedCells : undefined}
          flashColor={flashColor}
        />
        {/* ОТЛАДКА: выводим все возможные слова на этом поле */}
        <div style={{ margin: '3vw 0', padding: '2vw', background: '#f5f5f5', borderRadius: 8, fontSize: '0.95rem', color: '#333', maxHeight: 120, overflowY: 'auto' }}>
          <b>Все слова на поле ({roundData.words.length}):</b>
          <WordList words={roundData.words} />
        </div>
        {phase === 'results' && (
          <>
            <div style={{
              margin: '3vw 0',
              padding: '2vw',
              background: '#e3f2fd',
              borderRadius: 8,
              fontSize: '1.15rem',
              color: '#1976d2',
              textAlign: 'center',
              fontWeight: 600
            }}>
              <div>Раунд завершён!</div>
              <div style={{ marginTop: 8 }}>Ваш результат: <b style={{ color: '#1565c0', fontSize: '1.3em' }}>{score} очков</b></div>
            </div>
            <Results 
              foundWords={foundWords} 
              possibleWords={roundData.words} 
              leaderboard={leaderboard}
              usedWords={roundData.words}
            />
          </>
        )}
      </div>
    );
  }
  
  // Стартовый экран с двумя плитками GameBoard: "СТАРТ" и "СПРАВКА"
  const HELP_WORD = 'СПРАВКА';
  const helpBoard: CellType[][] = [
    [...HELP_WORD].map((letter, idx) => ({ letter, bonus: 'none', row: 0, col: idx }))
  ];

  // Обработчик свайпа по "СПРАВКА"
  const handleHelpPath = (path: Array<[number, number]>) => {
    // Проверяем, что проведены все буквы СПРАВКА подряд
    if (path.length === HELP_WORD.length && path.every(([r, c], idx) => r === 0 && c === idx)) {
      setScreen('help');
      setHelpSelected([]);
      setHelpFlashColor('green');
      setTimeout(() => setHelpFlashColor(null), 300);
    } else {
      setHelpFlashColor('red');
      setTimeout(() => setHelpFlashColor(null), 300);
      setTimeout(() => setHelpSelected([]), 350);
    }
  };
  // Обработчик свайпа вверх
  const handleStartTouchStart = (e: React.TouchEvent) => {
    startTouch.current.y = e.touches[0].clientY;
  };
  const handleStartTouchEnd = (e: React.TouchEvent) => {
    if (startTouch.current.y !== null) {
      const deltaY = startTouch.current.y - e.changedTouches[0].clientY;
      if (deltaY > 50) { // свайп вверх
        setScreen('help');
      }
    }
    startTouch.current.y = null;
  };
  return renderPhoneFrame(
    <div
      style={{ fontFamily: 'sans-serif', padding: '4vw', width: '100%', maxWidth: 430, margin: '0 auto', textAlign: 'center', boxSizing: 'border-box', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '6vw' }}
    >
      <h1 style={{ fontSize: '2.2rem', margin: '2vw 0 4vw 0' }}>Фундамент</h1>
      {userName && (
        <div style={{ marginBottom: '2vw', color: '#1976d2', fontWeight: 500 }}>
          Пользователь: {userName}
          <br />
          <span style={{ fontSize: '1rem', color: '#333' }}>Общий счёт: <b>{userTotalScore}</b></span>
        </div>
      )}
  <div style={{ display: 'flex', flexDirection: 'column', gap: '5vw', alignItems: 'center' }}>
        <div style={{ minWidth: 180, width: '60vw', maxWidth: 320 }}>
          <GameBoard
            board={startBoard}
            selectedCells={startSelected}
            onPathComplete={handleStartPath}
            onDragUpdate={setStartSelected}
            flashColor={startFlashColor}
            columnsCount={START_WORD.length}
          />
          <div style={{ fontSize: '1rem', color: '#888', margin: '1vw 0 0 0' }}>Проведите по буквам, чтобы начать</div>
        </div>
        <div style={{ minWidth: 180, width: '60vw', maxWidth: 320 }}>
          <GameBoard
            board={helpBoard}
            selectedCells={helpSelected}
            onPathComplete={handleHelpPath}
            onDragUpdate={setHelpSelected}
            flashColor={helpFlashColor}
            columnsCount={HELP_WORD.length}
          />
          <div style={{ fontSize: '1rem', color: '#888', margin: '1vw 0 0 0' }}>Проведите по буквам, чтобы открыть справку</div>
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24 }}>
          <button
            style={{ padding: '10px 24px', fontSize: '1.1rem', borderRadius: 8, border: 'none', background: '#1976d2', color: '#fff', cursor: 'pointer', fontWeight: 600 }}
            onClick={() => { setShowRegister(true); setRegisterInput(""); setRegisterError(""); }}
          >
            {userName ? 'Сменить пользователя' : 'Регистрация'}
          </button>
          <button
            style={{ padding: '10px 24px', fontSize: '1.1rem', borderRadius: 8, border: 'none', background: '#388e3c', color: '#fff', cursor: 'pointer', fontWeight: 600 }}
            onClick={() => { setShowLogin(true); }}
          >
            Войти
          </button>
        </div>
      {/* Модальное окно входа */}
      {showLogin && (
        <div style={{
          position: 'fixed', left: 0, top: 0, width: '100vw', height: '100vh', background: '#000a', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, minWidth: 260, boxShadow: '0 2px 16px #0004', textAlign: 'center' }}>
            <h2 style={{ marginBottom: 16 }}>Войти в профиль</h2>
            <input
              type="text"
              placeholder="Введите имя"
              value={registerInput}
              onChange={e => setRegisterInput(e.target.value)}
              style={{ padding: 8, fontSize: '1.1rem', borderRadius: 6, border: '1px solid #ccc', width: '90%', marginBottom: 12 }}
              maxLength={20}
              autoFocus
            />
            <div style={{ color: 'red', minHeight: 20, fontSize: '0.95rem' }}>{registerError}</div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 8 }}>
              <button
                style={{ padding: '8px 18px', fontSize: '1rem', borderRadius: 6, border: 'none', background: '#1976d2', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                onClick={async () => {
                  const name = registerInput.trim();
                  if (!name) {
                    setRegisterError('Введите имя');
                    return;
                  }
                  try {
                    await apiGetUser(name);
                    setUserName(name);
                    setShowLogin(false);
                    setRegisterError("");
                  } catch {
                    setRegisterError('Пользователь не найден');
                  }
                }}
              >Войти</button>
              <button
                style={{ padding: '8px 18px', fontSize: '1rem', borderRadius: 6, border: 'none', background: '#388e3c', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                onClick={async () => {
                  const name = registerInput.trim();
                  if (!name) {
                    setRegisterError('Введите имя');
                    return;
                  }
                  try {
                    await apiGetUser(name);
                    setRegisterError('Такой пользователь уже есть');
                  } catch {
                    await apiCreateUser(name);
                    setUserName(name);
                    setShowLogin(false);
                    setRegisterError("");
                  }
                }}
              >Создать нового</button>
              <button
                style={{ padding: '8px 18px', fontSize: '1rem', borderRadius: 6, border: 'none', background: '#eee', color: '#333', fontWeight: 600, cursor: 'pointer' }}
                onClick={() => { setShowLogin(false); setRegisterError(""); }}
              >Отмена</button>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* Модальное окно регистрации */}
      {showRegister && (
        <div style={{
          position: 'fixed', left: 0, top: 0, width: '100vw', height: '100vh', background: '#000a', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, minWidth: 260, boxShadow: '0 2px 16px #0004', textAlign: 'center' }}>
            <h2 style={{ marginBottom: 16 }}>Регистрация</h2>
            <input
              type="text"
              placeholder="Введите имя"
              value={registerInput}
              onChange={e => setRegisterInput(e.target.value)}
              style={{ padding: 8, fontSize: '1.1rem', borderRadius: 6, border: '1px solid #ccc', width: '90%', marginBottom: 12 }}
              maxLength={20}
              autoFocus
            />
            <div style={{ color: 'red', minHeight: 20, fontSize: '0.95rem' }}>{registerError}</div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 8 }}>
              <button
                style={{ padding: '8px 18px', fontSize: '1rem', borderRadius: 6, border: 'none', background: '#1976d2', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                onClick={async () => {
                  if (!registerInput.trim()) {
                    setRegisterError('Введите имя');
                    return;
                  }
                  const newUser = registerInput.trim();
                  setUserName(newUser);
                  // Сохраняем пользователя через API сразу после регистрации
                  try {
                    await apiCreateUser(newUser);
                  } catch {}
                  setShowRegister(false);
                }}
              >OK</button>
              <button
                style={{ padding: '8px 18px', fontSize: '1rem', borderRadius: 6, border: 'none', background: '#eee', color: '#333', fontWeight: 600, cursor: 'pointer' }}
                onClick={() => setShowRegister(false)}
              >Отмена</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default App;
