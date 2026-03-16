import React from 'react';
import { createPortal } from 'react-dom';
import { HuntersMark } from './HuntersMark';
import { TimerControls } from './TimerControls';
import { PomodoroSchedule, Session, SessionType, Beast } from '../../types';

interface TimerAreaProps {
  // Setup state
  inputHours: number;
  inputMinutes: number;
  onIncrementHours: () => void;
  onDecrementHours: () => void;
  onIncrementMinutes: () => void;
  onDecrementMinutes: () => void;
  onBeginHunt: () => void;
  // Active state
  schedule: PomodoroSchedule | null;
  currentSession: Session | null;
  timeLeft: number;
  isRunning: boolean;
  isEditingLabel: boolean;
  editingLabelText: string;
  ambience: 'off' | 'rain' | 'wind';
  pipWindow: Window | null;
  // Actions
  onStart: () => void;
  onPause: () => void;
  onCompleteEarly: () => void;
  onTogglePiP: () => void;
  onSetAmbience: (a: 'off' | 'rain' | 'wind') => void;
  onReset: () => void;
  onSetEditingLabel: (v: boolean) => void;
  onSetEditingLabelText: (v: string) => void;
  onUpdateLabel: (label?: string, beastId?: string) => void;
  // Drag-drop
  beasts: Beast[];
}

export const TimerArea: React.FC<TimerAreaProps> = ({
  inputHours, inputMinutes,
  onIncrementHours, onDecrementHours, onIncrementMinutes, onDecrementMinutes,
  onBeginHunt,
  schedule, currentSession, timeLeft, isRunning,
  isEditingLabel, editingLabelText, ambience, pipWindow,
  onStart, onPause, onCompleteEarly, onTogglePiP,
  onSetAmbience, onReset,
  onSetEditingLabel, onSetEditingLabelText, onUpdateLabel,
  beasts,
}) => {
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const beastId = e.dataTransfer.getData("application/beast-id");
    const textData = e.dataTransfer.getData("text/plain");

    if (beastId) {
      const beast = beasts.find(b => b.id === beastId);
      if (beast && schedule) {
        onUpdateLabel(beast.text, beast.id);
      }
    } else if (textData && schedule) {
      onUpdateLabel(textData);
    }
  };

  if (!schedule) {
    // Setup screen
    return (
      <div className="w-full max-w-2xl flex flex-col items-center justify-center space-y-10 py-10 animate-in zoom-in-95 duration-500">
        <div className="text-center space-y-4">
          <h2 className="text-4xl md:text-5xl font-black text-zinc-100 leading-tight font-gothic">Tonight, we hunt.</h2>
          <p className="text-zinc-500 text-lg font-medium">Set your hunt duration. We'll manage the dreams.</p>
        </div>

        {/* Time Dial */}
        <div className="flex items-center gap-4 md:gap-8 p-8 bg-zinc-900/50 rounded-2xl border border-zinc-700/30">
          <div className="flex flex-col items-center gap-2">
            <button onClick={onIncrementHours} className="p-2 text-zinc-500 hover:text-red-400 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
            </button>
            <div className="w-24 h-24 md:w-32 md:h-32 bg-zinc-800 rounded-xl flex items-center justify-center border-2 border-zinc-700">
              <span className="text-5xl md:text-6xl font-black text-zinc-100">{inputHours}</span>
            </div>
            <button onClick={onDecrementHours} className="p-2 text-zinc-500 hover:text-red-400 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
            </button>
            <span className="text-xs font-bold text-zinc-600 uppercase tracking-widest">Hours</span>
          </div>

          <div className="text-4xl font-black text-zinc-600 -mt-8">:</div>

          <div className="flex flex-col items-center gap-2">
            <button onClick={onIncrementMinutes} className="p-2 text-zinc-500 hover:text-red-400 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
            </button>
            <div className="w-24 h-24 md:w-32 md:h-32 bg-zinc-800 rounded-xl flex items-center justify-center border-2 border-zinc-700">
              <span className="text-5xl md:text-6xl font-black text-zinc-100">{inputMinutes.toString().padStart(2, '0')}</span>
            </div>
            <button onClick={onDecrementMinutes} className="p-2 text-zinc-500 hover:text-red-400 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
            </button>
            <span className="text-xs font-bold text-zinc-600 uppercase tracking-widest">Mins</span>
          </div>
        </div>

        <button
          onClick={onBeginHunt}
          className="hunt-button px-12 py-5 text-2xl font-black tracking-widest uppercase hover:scale-105 active:scale-95 transition-all font-gothic"
        >
          Begin the Hunt
        </button>
      </div>
    );
  }

  // Active session
  return (
    <div className="w-full flex flex-col items-center justify-center hunt-card p-8 relative animate-in fade-in slide-in-from-bottom-5 duration-500">
      {/* Session Label / Drop Zone */}
      <div
        className="absolute top-10 left-10 right-10 flex flex-col items-center gap-1 group"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        {isEditingLabel ? (
          <div className="flex items-center gap-2 animate-in slide-in-from-top-2">
            <input
              autoFocus
              className="hunt-input px-4 py-2 text-center font-bold text-red-400"
              value={editingLabelText}
              onChange={(e) => onSetEditingLabelText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onUpdateLabel()}
              onBlur={() => onUpdateLabel()}
            />
            <button onClick={() => onUpdateLabel()} className="bg-emerald-700 text-white p-2 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
            </button>
          </div>
        ) : (
          <div
            onClick={() => { onSetEditingLabelText(currentSession?.label || ''); onSetEditingLabel(true); }}
            className="cursor-pointer group flex flex-col items-center p-4 rounded-xl transition-all border border-transparent hover:bg-zinc-800/50 hover:border-zinc-700/50 border-dashed hover:border-red-900/50"
            title="Click to edit or drop a beast here"
          >
            <p className="text-zinc-600 font-bold uppercase text-[10px] tracking-[0.3em] group-hover:text-red-400 transition-colors">Quarry</p>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black text-zinc-200 tracking-tight font-gothic">{currentSession?.label}</h2>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
            </div>
          </div>
        )}
      </div>

      {/* Timer Display */}
      {pipWindow ? (
        createPortal(
          <div className="h-full w-full flex flex-col items-center justify-center p-4" style={{ backgroundColor: '#0f0f1a' }}>
            <HuntersMark
              seconds={timeLeft}
              totalSeconds={currentSession?.durationMinutes ? currentSession.durationMinutes * 60 : 1}
              label={currentSession?.type || 'SESSION'}
              isFocus={currentSession?.type === SessionType.FOCUS}
            />
            <button
              onClick={onTogglePiP}
              className="mt-4 text-xs font-bold text-red-400 uppercase tracking-widest hover:text-red-300"
            >
              Restore Window
            </button>
          </div>,
          pipWindow.document.body
        )
      ) : null}

      {!pipWindow && currentSession && (
        <HuntersMark
          seconds={timeLeft}
          totalSeconds={currentSession.durationMinutes * 60}
          label={currentSession.type}
          isFocus={currentSession.type === SessionType.FOCUS}
        />
      )}

      <TimerControls
        isRunning={isRunning}
        onStart={onStart}
        onPause={onPause}
        onCompleteEarly={onCompleteEarly}
        onTogglePiP={onTogglePiP}
        pipActive={!!pipWindow}
        ambience={ambience}
        onSetAmbience={onSetAmbience}
        onReset={onReset}
      />
    </div>
  );
};
