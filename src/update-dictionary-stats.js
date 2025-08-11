const fs = require('fs');
const path = require('path');

const dictPath = path.join(__dirname, 'dictionary.json');
const statsPath = path.join(__dirname, 'dictionary-stats.txt');

const dictionary = JSON.parse(fs.readFileSync(dictPath, 'utf8'));

let total = 0;
let lines = [];
for (const letter of Object.keys(dictionary)) {
  const count = dictionary[letter].length;
  total += count;
  lines.push(`${letter}: ${count}`);
}

lines.push('');
lines.push(`Всего слов: ${total}`);
lines.push('');
lines.push('Для обновления статистики выполните команду:');
lines.push('node src/update-dictionary-stats.js');

fs.writeFileSync(statsPath, lines.join('\n'), 'utf8');
console.log('Статистика словаря обновлена!');
