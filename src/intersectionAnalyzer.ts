// intersectionAnalyzer.ts
// Анализатор пересечений букв на игровом поле
// Экспортирует функцию analyzeIntersections

export type CellPosition = { row: number; col: number };

export type WordRoute = CellPosition[];

export interface IntersectionStats {
  // Ключ — строка "row,col", значение — сколько раз клетка используется в словах
  [cellId: string]: number;
}

/**
 * Анализирует пересечения букв на поле
 * @param routes массив маршрутов (траекторий) найденных слов
 * @returns статистика пересечений: сколько раз каждая клетка используется
 */
export function analyzeIntersections(routes: WordRoute[]): IntersectionStats {
  const stats: IntersectionStats = {};
  for (const route of routes) {
    for (const pos of route) {
      const key = `${pos.row},${pos.col}`;
      stats[key] = (stats[key] || 0) + 1;
    }
  }
  return stats;
}

/**
 * Вспомогательная функция для получения распределения пересечений
 * @param stats статистика пересечений
 * @returns объект: { количество_пересечений: сколько_клеток }
 */
export function getIntersectionDistribution(stats: IntersectionStats): Record<number, number> {
  const distribution: Record<number, number> = {};
  Object.values(stats).forEach(count => {
    distribution[count] = (distribution[count] || 0) + 1;
  });
  return distribution;
}
