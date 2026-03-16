import React from 'react';
import { Session, SessionType } from '../../types';

interface HuntRosterProps {
  sessions: Session[];
  currentIndex: number;
}

export const HuntRoster: React.FC<HuntRosterProps> = ({ sessions, currentIndex }) => {
  return (
    <div className="hunt-card p-6">
      <h3 className="text-lg font-bold text-zinc-200 mb-6 flex items-center gap-2 font-gothic">
        <span>📜</span> Hunt Roster
      </h3>
      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
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
    </div>
  );
};
