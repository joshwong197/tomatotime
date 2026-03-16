import React from 'react';
import { ArchivedSeed, GardenBed } from '../types';

interface ArchivedSeedsModalProps {
  archivedSeeds: ArchivedSeed[];
  gardenBeds: GardenBed[];
  onClose: () => void;
  onClearAll: () => void;
}

const getSunIcon = (p: string) => {
  switch (p) {
    case 'sun': return '☀️';
    case 'partial': return '⛅';
    case 'shade': return '☁️';
    default: return '🌱';
  }
};

const formatFocusTime = (seconds: number = 0): string => {
  if (seconds === 0) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};

export const ArchivedSeedsModal: React.FC<ArchivedSeedsModalProps> = ({
  archivedSeeds, gardenBeds, onClose, onClearAll
}) => {
  const getBedName = (bedId?: string) => {
    if (!bedId) return null;
    return gardenBeds.find(b => b.id === bedId)?.name || null;
  };

  const exportToCSV = () => {
    const headers = ['Task', 'Priority', 'Archived At', 'Reason', 'Focus Time (sec)', 'Garden Bed'];
    const rows = archivedSeeds.map(s => [
      s.text.replace(/,/g, ' '),
      s.priority,
      new Date(s.archivedAt).toLocaleString(),
      s.archiveReason,
      s.focusTime || 0,
      getBedName(s.gardenBedId) || ''
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `tomato_seeds_archive_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClearAll = () => {
    if (window.confirm("Clear all previous seeds? This cannot be undone.")) {
      onClearAll();
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-stone-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="tomato-card w-full max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-8 border-b-4 border-stone-50 flex justify-between items-center bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-3xl font-black text-stone-700 flex items-center gap-3">
              <span>📦</span> Previous Seeds
            </h2>
            <p className="text-stone-400 font-bold text-xs uppercase tracking-widest mt-1">
              {archivedSeeds.length} seed{archivedSeeds.length !== 1 ? 's' : ''} archived
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-full transition-colors text-stone-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-8 space-y-3 bg-stone-50/50 custom-scrollbar">
          {archivedSeeds.length === 0 ? (
            <div className="text-center py-20 space-y-4">
              <div className="text-6xl grayscale opacity-30">📭</div>
              <p className="text-stone-400 font-bold uppercase tracking-widest italic">No archived seeds yet.</p>
            </div>
          ) : (
            archivedSeeds.map((seed, idx) => {
              const ft = formatFocusTime(seed.focusTime);
              const bedName = getBedName(seed.gardenBedId);
              return (
                <div
                  key={`${seed.id}-${seed.archivedAt}-${idx}`}
                  className="bg-white p-5 rounded-3xl border-2 border-stone-100 shadow-sm flex items-center justify-between hover:border-stone-200 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="text-2xl flex-shrink-0">{getSunIcon(seed.priority)}</div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-stone-800 leading-tight break-words">{seed.text}</h4>
                      <div className="flex flex-wrap items-center gap-2 text-[10px] text-stone-400 font-black uppercase tracking-widest mt-1">
                        <span>{new Date(seed.archivedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        <span>•</span>
                        <span className={seed.archiveReason === 'completed' ? 'text-green-500' : 'text-stone-400'}>
                          {seed.archiveReason === 'completed' ? '✅ Harvested' : '🗑️ Removed'}
                        </span>
                        {ft && (
                          <>
                            <span>•</span>
                            <span className="text-red-400">⏱ {ft} focused</span>
                          </>
                        )}
                        {bedName && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-500">🌿 {bedName}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-8 bg-white border-t-4 border-stone-50 flex gap-4">
          <button
            onClick={exportToCSV}
            disabled={archivedSeeds.length === 0}
            className="flex-1 tomato-button-secondary py-4 font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 disabled:opacity-30"
          >
            <span>📊</span> Export CSV
          </button>
          <button
            onClick={handleClearAll}
            disabled={archivedSeeds.length === 0}
            className="flex-1 tomato-button py-4 font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 disabled:opacity-30"
          >
            <span>🗑️</span> Clear All
          </button>
        </div>
      </div>
    </div>
  );
};
