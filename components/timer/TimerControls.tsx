import React from 'react';

interface TimerControlsProps {
  isRunning: boolean;
  onStart: () => void;
  onPause: () => void;
  onCompleteEarly: () => void;
  onTogglePiP: () => void;
  pipActive: boolean;
  ambience: 'off' | 'rain' | 'wind';
  onSetAmbience: (a: 'off' | 'rain' | 'wind') => void;
  onReset: () => void;
}

export const TimerControls: React.FC<TimerControlsProps> = ({
  isRunning, onStart, onPause, onCompleteEarly, onTogglePiP, pipActive,
  ambience, onSetAmbience, onReset
}) => {
  return (
    <div className="flex flex-col items-center gap-6 mt-4">
      {/* Ambience Controls */}
      <div className="flex items-center gap-2 bg-zinc-900/50 p-1 rounded-full border border-zinc-700/50">
        <button
          onClick={() => onSetAmbience('off')}
          className={`p-2 rounded-full transition-all text-sm ${ambience === 'off' ? 'bg-zinc-800 shadow text-zinc-300' : 'text-zinc-500 hover:text-zinc-300'}`}
          title="Silence"
        >
          🔇
        </button>
        <button
          onClick={() => onSetAmbience('rain')}
          className={`p-2 rounded-full transition-all text-sm ${ambience === 'rain' ? 'bg-blue-900/50 shadow text-blue-300' : 'text-zinc-500 hover:text-blue-400'}`}
          title="Rain"
        >
          🌧️
        </button>
        <button
          onClick={() => onSetAmbience('wind')}
          className={`p-2 rounded-full transition-all text-sm ${ambience === 'wind' ? 'bg-emerald-900/50 shadow text-emerald-300' : 'text-zinc-500 hover:text-emerald-400'}`}
          title="Wind"
        >
          🍃
        </button>
      </div>

      <div className="flex items-center gap-8">
        {!isRunning ? (
          <button onClick={onStart} className="hunt-button h-24 w-24 flex items-center justify-center hover:scale-110 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 fill-current translate-x-1" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
          </button>
        ) : (
          <button onClick={onPause} className="hunt-button-secondary h-24 w-24 flex items-center justify-center hover:scale-110 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 fill-current" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
          </button>
        )}

        <div className="flex flex-col gap-2">
          <button onClick={onCompleteEarly} className="bg-amber-700 text-amber-100 h-12 w-12 rounded-full flex items-center justify-center hover:scale-110 shadow-[0_3px_0_0_#78350f] active:translate-y-1 active:shadow-none transition-all" title="Complete early">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
          </button>
          <button
            onClick={onTogglePiP}
            className={`bg-zinc-700 text-zinc-300 h-12 w-12 rounded-full flex items-center justify-center hover:scale-110 shadow-[0_3px_0_0_#3f3f46] active:translate-y-1 active:shadow-none transition-all ${pipActive ? 'ring-2 ring-red-500' : ''}`}
            title="Pop Out Window"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </button>
        </div>
      </div>

      <button
        onClick={onReset}
        className="text-zinc-500 font-bold hover:text-red-400 transition-colors uppercase text-[10px] tracking-[0.3em]"
      >
        Abandon Hunt
      </button>
    </div>
  );
};
