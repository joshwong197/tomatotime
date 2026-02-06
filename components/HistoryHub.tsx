
import React from 'react';
import { CompletedSession, SessionType } from '../types';

interface HistoryHubProps {
  history: CompletedSession[];
  onClose: () => void;
}

export const HistoryHub: React.FC<HistoryHubProps> = ({ history, onClose }) => {
  const exportToCSV = () => {
    const headers = ['Date', 'Task', 'Type', 'Start Time', 'End Time', 'Duration (Min)'];
    const rows = history.map(s => [
      s.date,
      s.label.replace(/,/g, ' '),
      s.type,
      new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      new Date(s.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      s.durationMinutes
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `tomato_harvest_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatTime = (ts: number) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-stone-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="tomato-card w-full max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden shadow-2xl">
        <div className="p-8 border-b-4 border-stone-50 flex justify-between items-center bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-3xl font-black text-red-600 flex items-center gap-3">
              <span>📓</span> Garden Journal
            </h2>
            <p className="text-stone-400 font-bold text-xs uppercase tracking-widest mt-1">Last 7 days of growth</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-full transition-colors text-stone-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-stone-50/50 custom-scrollbar">
          {history.length === 0 ? (
            <div className="text-center py-20 space-y-4">
              <div className="text-6xl grayscale opacity-30">📭</div>
              <p className="text-stone-400 font-bold uppercase tracking-widest italic">No harvests recorded yet.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Grouping by date simple logic */}
              {/* Fix: Explicitly cast to string[] to resolve 'unknown' inference error in Date constructor */}
              {(Array.from(new Set(history.map(s => s.date))) as string[]).sort((a, b) => new Date(b).getTime() - new Date(a).getTime()).map(date => (
                <div key={date} className="space-y-3">
                  <h3 className="text-stone-400 font-black text-[10px] uppercase tracking-[0.4em] pl-2">{date}</h3>
                  {history.filter(s => s.date === date).map(session => (
                    <div key={session.id} className="bg-white p-5 rounded-3xl border-2 border-stone-100 shadow-sm flex items-center justify-between hover:border-red-200 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="text-3xl">{session.type === SessionType.FOCUS ? '🍅' : '🥗'}</div>
                        <div>
                          <h4 className="font-bold text-stone-800 leading-tight">{session.label}</h4>
                          <div className="flex items-center gap-2 text-[10px] text-stone-400 font-black uppercase tracking-widest">
                            <span>{formatTime(session.startTime)} - {formatTime(session.endTime)}</span>
                            <span>•</span>
                            <span>{session.durationMinutes} min</span>
                          </div>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${session.type === SessionType.FOCUS ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'}`}>
                        {session.type}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-8 bg-white border-t-4 border-stone-50 flex gap-4">
          <button 
            onClick={exportToCSV}
            disabled={history.length === 0}
            className="flex-1 tomato-button-secondary py-4 font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 disabled:opacity-30"
          >
            <span>📦</span> Export Harvest Crate (CSV)
          </button>
        </div>
      </div>
    </div>
  );
};
