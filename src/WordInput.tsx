import React, { useState } from "react";

interface WordInputProps {
  onSubmit: (word: string) => void;
}

const WordInput: React.FC<WordInputProps> = ({ onSubmit }) => {
  const [word, setWord] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (word.trim()) {
      onSubmit(word.trim().toLowerCase());
      setWord("");
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ margin: '16px 0' }}>
      <input
        type="text"
        value={word}
        onChange={e => setWord(e.target.value)}
        placeholder="Введите слово"
        style={{ fontSize: 18, padding: 8, width: 180 }}
      />
      <button type="submit" style={{ fontSize: 18, marginLeft: 8 }}>Отправить</button>
    </form>
  );
};

export default WordInput;
