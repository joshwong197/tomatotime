
import React from 'react';
import { SessionType } from '../types';

interface NotificationOverlayProps {
  type: SessionType;
  seedId?: string;
  onClose: () => void;
  onNext: () => void;
  onHarvest?: () => void;
}

export const NotificationOverlay: React.FC<NotificationOverlayProps> = ({ type, seedId, onClose, onNext, onHarvest }) => {
  const isFocus = type === SessionType.FOCUS;
  const [harvested, setHarvested] = React.useState(false);

  const handleHarvest = () => {
    if (onHarvest) {
      onHarvest();
      setHarvested(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-red-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="tomato-card p-10 max-w-sm w-full text-center space-y-6 transform animate-bounce-short">
        <div className="text-6xl">
          {isFocus ? '🍅' : '🥗'}
        </div>

        <div className="space-y-2">
          <h2 className="text-3xl font-black text-red-600">
            {isFocus ? 'Harvest Time!' : 'Break’s Over!'}
          </h2>
          <p className="text-stone-500 font-medium">
            {isFocus ? "You've grown a beautiful focus tomato!" : "Back to the garden, little tomato!"}
          </p>
        </div>

        <div className="flex flex-col gap-3 pt-4">
          {isFocus && seedId && !harvested && onHarvest && (
            <button
              onClick={handleHarvest}
              className="bg-green-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-green-600 hover:scale-105 shadow-lg shadow-green-200 transition-all flex items-center justify-center gap-2"
            >
              <span>✅</span> Mark Task Complete
            </button>
          )}
          {harvested && (
            <div className="py-2 font-bold text-green-600 bg-green-50 rounded-xl mb-2">
              Task Harvested!
            </div>
          )}

          <button
            onClick={onNext}
            className="tomato-button-secondary py-4 font-bold text-lg hover:scale-105"
          >
            Start Next Session
          </button>
          <button
            onClick={onClose}
            className="text-stone-400 font-bold text-sm hover:text-stone-600"
          >
            Wait, one more minute...
          </button>
        </div>
      </div>
    </div>
  );
};
