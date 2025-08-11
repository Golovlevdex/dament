const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3001;

app.use(express.json());

const USERS_PATH = path.join(__dirname, 'users.json');

// Получить всех пользователей
app.get('/api/users', (req, res) => {
  fs.readFile(USERS_PATH, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Ошибка чтения файла' });
    try {
      const json = JSON.parse(data);
      res.json(json.users || {});
    } catch {
      res.status(500).json({ error: 'Ошибка парсинга файла' });
    }
  });
});

// Получить пользователя по имени
app.get('/api/users/:name', (req, res) => {
  fs.readFile(USERS_PATH, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Ошибка чтения файла' });
    try {
      const json = JSON.parse(data);
      const user = json.users[req.params.name];
      if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
      res.json(user);
    } catch {
      res.status(500).json({ error: 'Ошибка парсинга файла' });
    }
  });
});

// Создать или обновить пользователя
app.post('/api/users/:name', (req, res) => {
  fs.readFile(USERS_PATH, 'utf8', (err, data) => {
    let json = { users: {} };
    if (!err) {
      try {
        json = JSON.parse(data);
      } catch {}
    }
    json.users[req.params.name] = req.body;
    fs.writeFile(USERS_PATH, JSON.stringify(json, null, 2), err2 => {
      if (err2) return res.status(500).json({ error: 'Ошибка записи файла' });
      res.json({ ok: true });
    });
  });
});

app.listen(PORT, () => {
  console.log(`User API server running on http://localhost:${PORT}`);
});
