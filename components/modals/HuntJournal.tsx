import React from 'react';
import { CompletedSession, SessionType, SlainBeast } from '../../types';

interface HuntJournalProps {
  history: CompletedSession[];
  slainBeasts: SlainBeast[];
  onClose: () => void;
}

const formatHuntTime = (seconds: number = 0): string => {
  if (seconds === 0) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};

export const HuntJournal: React.FC<HuntJournalProps> = ({ history, slainBeasts, onClose }) => {
  const getBeastHuntTime = (beastId?: string): number | null => {
    if (!beastId) return null;
    const beast = slainBeasts.find(b => b.id === beastId);
    return beast?.huntTime ?? null;
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Quarry', 'Type', 'Start Time', 'End Time', 'Duration (Min)', 'Hunt Time'];
    const rows = history.map(s => {
      const ht = getBeastHuntTime(s.beastId);
      return [
        s.date,
        s.label.replace(/,/g, ' '),
        s.type,
        new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        new Date(s.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        s.durationMinutes,
        ht != null && ht > 0 ? formatHuntTime(ht) : ''
      ];
    });
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `hunt_journal_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatTime = (ts: number) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="hunt-card w-full max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-zinc-800 flex justify-between items-center sticky top-0 z-10">
          <div>
            <h2 className="text-3xl font-black text-red-500 flex items-center gap-3 font-gothic">
              <span>📓</span> Hunt Journal
            </h2>
            <p className="text-zinc-500 font-bold text-xs uppercase tracking-widest mt-1">Last 7 nights of the hunt</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {history.length === 0 ? (
            <div className="text-center py-20 space-y-4">
              <div className="text-6xl opacity-30">📓</div>
              <p className="text-zinc-600 font-bold uppercase tracking-widest italic">No hunts recorded yet.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {(Array.from(new Set(history.map(s => s.date))) as string[])
                .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
                .map(date => (
                  <div key={date} className="space-y-3">
                    <h3 className="text-zinc-500 font-black text-[10px] uppercase tracking-[0.4em] pl-2">{date}</h3>
                    {history.filter(s => s.date === date).map(session => {
                      const ht = session.type === SessionType.FOCUS ? getBeastHuntTime(session.beastId) : null;
                      const htDisplay = ht != null && ht > 0 ? formatHuntTime(ht) : null;
                      return (
                        <div key={session.id} className="bg-zinc-900/50 p-5 rounded-xl border border-zinc-800 flex items-center justify-between hover:border-zinc-700 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="text-3xl">{session.type === SessionType.FOCUS ? '⚔️' : '🌙'}</div>
                            <div>
                              <h4 className="font-bold text-zinc-300 leading-tight">{session.label}</h4>
                              <div className="flex flex-wrap items-center gap-2 text-[10px] text-zinc-500 font-black uppercase tracking-widest">
                                <span>{formatTime(session.startTime)} - {formatTime(session.endTime)}</span>
                                <span>•</span>
                                <span>{session.durationMinutes} min</span>
                                {htDisplay && (
                                  <>
                                    <span>•</span>
                                    <span className="text-amber-400">⏱ {htDisplay} hunted</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${
                            session.type === SessionType.FOCUS ? 'bg-red-900/30 text-red-400' : 'bg-blue-900/30 text-blue-300'
                          }`}>
                            {session.type === SessionType.FOCUS ? 'HUNT' : 'DREAM'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
            </div>
          )}
        </div>

        <div className="p-8 border-t border-zinc-800 flex gap-4">
          <button
            onClick={exportToCSV}
            disabled={history.length === 0}
            className="flex-1 hunt-button-secondary py-4 font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 disabled:opacity-30"
          >
            <span>📦</span> Export Hunt Records (CSV)
          </button>
        </div>
      </div>
    </div>
  );
};
