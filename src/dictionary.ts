// Загрузка словаря из JSON

import dictionaryObj from './dictionary.json';

// Собираем все слова из объекта в один массив
export const gameDictionary: string[] = Object.values(dictionaryObj).flat();

export function isWordInDictionary(word: string): boolean {
  return gameDictionary.includes(word.toUpperCase());
}

