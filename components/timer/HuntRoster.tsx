import React, { useState } from 'react';
import { Session, SessionType } from '../../types';

interface HuntRosterProps {
  sessions: Session[];
  currentIndex: number;
}

export const HuntRoster: React.FC<HuntRosterProps> = ({ sessions, currentIndex }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="hunt-card p-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-lg font-bold text-zinc-200 flex items-center gap-2 font-gothic hover:text-zinc-100 transition-colors"
      >
        <span>📜</span> Hunt Roster
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-4 w-4 ml-auto text-zinc-500 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
      {isExpanded && (
      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 mt-6">
        {sessions.map((session, idx) => (
          <div
            key={session.id}
            className={`p-4 rounded-xl flex items-center justify-between transition-all duration-300 ${
              idx === currentIndex
                ? 'bg-red-900/30 border border-red-800/50 scale-105 shadow-sm shadow-red-900/20'
                : idx < currentIndex
                  ? 'bg-zinc-900/50 opacity-40'
                  : 'bg-zinc-900/30 border border-zinc-800/30 opacity-70'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="text-2xl">{session.type === SessionType.FOCUS ? '⚔️' : '🌙'}</div>
              <div>
                <h4 className={`font-bold text-sm ${idx === currentIndex ? 'text-zinc-200' : 'text-zinc-500'}`}>
                  {session.label}
                </h4>
                <p className="text-[10px] text-zinc-600 font-bold uppercase">{session.durationMinutes} min</p>
              </div>
            </div>
            {idx < currentIndex && (
              <div className="text-red-400 text-lg">☠️</div>
            )}
          </div>
        ))}
      </div>
      )}
    </div>
  );
};
