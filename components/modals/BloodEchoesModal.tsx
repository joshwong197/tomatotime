import React from 'react';
import { SlainBeast, HuntingGround, ThreatLevel } from '../../types';

interface BloodEchoesModalProps {
  slainBeasts: SlainBeast[];
  grounds: HuntingGround[];
  onClose: () => void;
  onClearAll: () => void;
}

const THREAT_ICONS: Record<ThreatLevel, string> = {
  nightmare: '💀',
  boss: '👹',
  beast: '🐺',
};

const formatHuntTime = (seconds: number = 0): string => {
  if (seconds === 0) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};

export const BloodEchoesModal: React.FC<BloodEchoesModalProps> = ({
  slainBeasts, grounds, onClose, onClearAll
}) => {
  const getGroundName = (groundsId?: string) => {
    if (!groundsId) return null;
    return grounds.find(g => g.id === groundsId)?.name || null;
  };

  const exportToCSV = () => {
    const headers = ['Beast', 'Threat', 'Archived At', 'Fate', 'Hunt Time (sec)', 'Hunting Ground'];
    const rows = slainBeasts.map(b => [
      b.text.replace(/,/g, ' '),
      b.threat,
      new Date(b.archivedAt).toLocaleString(),
      b.fate,
      b.huntTime || 0,
      getGroundName(b.groundsId) || ''
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `blood_echoes_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClearAll = () => {
    if (window.confirm("Purge all blood echoes? This cannot be undone.")) {
      onClearAll();
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="hunt-card w-full max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-zinc-800 flex justify-between items-center sticky top-0 z-10">
          <div>
            <h2 className="text-3xl font-black text-red-500 flex items-center gap-3 font-gothic">
              <span>🩸</span> Blood Echoes
            </h2>
            <p className="text-zinc-500 font-bold text-xs uppercase tracking-widest mt-1">
              {slainBeasts.length} beast{slainBeasts.length !== 1 ? 's' : ''} recorded
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-3">
          {slainBeasts.length === 0 ? (
            <div className="text-center py-20 space-y-4">
              <div className="text-6xl opacity-30">🩸</div>
              <p className="text-zinc-600 font-bold uppercase tracking-widest italic">No echoes linger here.</p>
            </div>
          ) : (
            slainBeasts.map((beast, idx) => {
              const ht = formatHuntTime(beast.huntTime);
              const groundName = getGroundName(beast.groundsId);
              return (
                <div
                  key={`${beast.id}-${beast.archivedAt}-${idx}`}
                  className="bg-zinc-900/50 p-5 rounded-xl border border-zinc-800 flex items-center justify-between hover:border-zinc-700 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="text-2xl flex-shrink-0">{THREAT_ICONS[beast.threat]}</div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-zinc-300 leading-tight break-words">{beast.text}</h4>
                      <div className="flex flex-wrap items-center gap-2 text-[10px] text-zinc-500 font-black uppercase tracking-widest mt-1">
                        <span>{new Date(beast.archivedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        <span>•</span>
                        <span className={beast.fate === 'slain' ? 'text-red-400' : 'text-zinc-500'}>
                          {beast.fate === 'slain' ? '☠️ Slain' : '🚪 Abandoned'}
                        </span>
                        {ht && (
                          <>
                            <span>•</span>
                            <span className="text-amber-400">⏱ {ht} hunted</span>
                          </>
                        )}
                        {groundName && (
                          <>
                            <span>•</span>
                            <span className="text-amber-500/70">⚑ {groundName}</span>
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

        <div className="p-8 border-t border-zinc-800 flex gap-4">
          <button
            onClick={exportToCSV}
            disabled={slainBeasts.length === 0}
            className="flex-1 hunt-button-secondary py-4 font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 disabled:opacity-30"
          >
            <span>📊</span> Export CSV
          </button>
          <button
            onClick={handleClearAll}
            disabled={slainBeasts.length === 0}
            className="flex-1 hunt-button py-4 font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 disabled:opacity-30"
          >
            <span>🗑️</span> Purge All
          </button>
        </div>
      </div>
    </div>
  );
};
