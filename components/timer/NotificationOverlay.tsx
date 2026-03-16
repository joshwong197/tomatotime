import React from 'react';
import { SessionType } from '../../types';

interface NotificationOverlayProps {
  type: SessionType;
  onClose: () => void;
  onNext: () => void;
}

export const NotificationOverlay: React.FC<NotificationOverlayProps> = ({ type, onClose, onNext }) => {
  const isFocus = type === SessionType.FOCUS;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="hunt-card p-10 max-w-sm w-full text-center space-y-6">
        <div className="text-6xl">
          {isFocus ? '⚔️' : '🌙'}
        </div>

        <div className="space-y-2">
          <h2 className="text-3xl font-black text-red-500 font-gothic">
            {isFocus ? 'Prey Slaughtered' : 'The Dream Awaits'}
          </h2>
          <p className="text-zinc-400 font-medium">
            {isFocus ? "A fine hunt. The blood echoes linger." : "Return to the hunt, good hunter."}
          </p>
        </div>

        <div className="flex flex-col gap-3 pt-4">
          <button
            onClick={onNext}
            className="hunt-button-secondary py-4 font-bold text-lg hover:scale-105"
          >
            {isFocus ? 'Enter the Dream' : 'Resume the Hunt'}
          </button>
          <button
            onClick={onClose}
            className="text-zinc-500 font-bold text-sm hover:text-zinc-300"
          >
            Linger a moment longer...
          </button>
        </div>
      </div>
    </div>
  );
};
