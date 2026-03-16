import React from 'react';
import { SessionType } from '../../types';

interface MobileTimerBarProps {
  timeLeft: number;
  isRunning: boolean;
  isFocus: boolean;
  sessionLabel: string;
  onStart: () => void;
  onPause: () => void;
}

export const MobileTimerBar: React.FC<MobileTimerBarProps> = ({
  timeLeft, isRunning, isFocus, sessionLabel, onStart, onPause,
}) => {
  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`lg:hidden sticky top-0 z-30 px-4 py-3 flex items-center gap-4 backdrop-blur-md border-b ${
      isFocus ? 'bg-red-900/30 border-red-800/30' : 'bg-blue-900/20 border-blue-800/20'
    }`}>
      <div className="text-2xl">{isFocus ? '⚔️' : '🌙'}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-zinc-400 truncate">{sessionLabel}</p>
        <p className="text-2xl font-black text-zinc-100 font-gothic tracking-tight">{formatTime(timeLeft)}</p>
      </div>
      <button
        onClick={isRunning ? onPause : onStart}
        className={`h-12 w-12 rounded-full flex items-center justify-center transition-all ${
          isRunning
            ? 'hunt-button-secondary'
            : 'hunt-button'
        }`}
      >
        {isRunning ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 fill-current" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 fill-current translate-x-0.5" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
        )}
      </button>
    </div>
  );
};
