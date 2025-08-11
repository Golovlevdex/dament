import React from "react";

interface TimerProps {
  seconds: number;
}

const Timer: React.FC<TimerProps> = ({ seconds }) => {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return (
    <div style={{ fontSize: 20, margin: '16px 0' }}>
      Таймер: {min}:{sec.toString().padStart(2, '0')}
    </div>
  );
};

export default Timer;
