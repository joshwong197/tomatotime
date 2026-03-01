import React, { useState, useRef, useEffect } from 'react';
import { Seed } from '../types';

interface SeedChecklistProps {
  seeds: Seed[];
  onAdd: (texts: string[], priority: 'sun' | 'partial' | 'shade') => void;
  onEdit: (id: string, text: string, priority?: 'sun' | 'partial' | 'shade') => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, status: 'active' | 'backlog') => void;
  onClear: () => void;
  archivedCount: number;
  onViewArchive: () => void;
  selectedTaskId: string | null;
  onSelectTask: (id: string | null) => void;
}

const formatFocusTime = (seconds: number = 0): string => {
  if (seconds === 0) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export const SeedChecklist: React.FC<SeedChecklistProps> = ({
  seeds, onAdd, onEdit, onToggle, onDelete, onMove, onClear,
  archivedCount, onViewArchive, selectedTaskId, onSelectTask
}) => {
  const [newSeedText, setNewSeedText] = useState('');
  const [newSeedPriority, setNewSeedPriority] = useState<'sun' | 'partial' | 'shade'>('partial');
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [editingPriority, setEditingPriority] = useState<'sun' | 'partial' | 'shade'>('partial');
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSeedText.trim()) {
      if (isBatchMode) {
        const tasks = newSeedText.split(/\n/).map(t => t.trim()).filter(t => t.length > 0);
        if (tasks.length > 0) onAdd(tasks, newSeedPriority);
      } else {
        onAdd([newSeedText.trim()], newSeedPriority);
      }
      setNewSeedText('');
      setNewSeedPriority('partial'); // Reset to default
      setIsBatchMode(false);
    }
  };

  const handleStartEdit = (seed: Seed) => {
    setEditingId(seed.id);
    setEditingText(seed.text);
    setEditingPriority(seed.priority || 'partial');
  };

  const handleSaveEdit = () => {
    if (editingId && editingText.trim()) {
      onEdit(editingId, editingText.trim(), editingPriority);
      setEditingId(null);
      setEditingText('');
    } else {
      setEditingId(null);
    }
  };

  const handleKeyDownEdit = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveEdit();
    if (e.key === 'Escape') setEditingId(null);
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("application/tomato-seed", id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDropOnBench = (e: React.DragEvent) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("application/tomato-seed");
    if (id) onMove(id, 'active');
  };

  const handleDropOnPacket = (e: React.DragEvent) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("application/tomato-seed");
    if (id) onMove(id, 'backlog');
  };

  const getSunIcon = (p: string) => {
    switch (p) {
      case 'sun': return '☀️';
      case 'partial': return '⛅';
      case 'shade': return '☁️';
      default: return '🌱';
    }
  };

  const activeSeeds = seeds.filter(s => s.status === 'active' && !s.completed);
  const backlogSeeds = seeds.filter(s => s.status === 'backlog' && !s.completed);
  // Sort backlog by priority: Sun > Partial > Shade
  const sortedBacklog = [...backlogSeeds].sort((a, b) => {
    const pMap = { sun: 3, partial: 2, shade: 1 };
    const pA = pMap[a.priority || 'partial'];
    const pB = pMap[b.priority || 'partial'];
    if (pA !== pB) return pB - pA;
    return b.createdAt - a.createdAt;
  });

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Top: The Potting Bench (Active) */}
      <div
        className="tomato-card p-4 bg-yellow-50/50 border-yellow-100 min-h-[140px] flex flex-col transition-colors hover:bg-yellow-50"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDropOnBench}
      >
        <h3 className="text-sm font-black text-yellow-800 uppercase tracking-widest mb-3 flex items-center justify-between">
          <span>🪴 Potting Bench</span>
          <span className="text-[10px] bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full">{activeSeeds.length}/5</span>
        </h3>

        {activeSeeds.length === 0 ? (
          <div className="flex-1 flex items-center justify-center border-2 border-dashed border-yellow-200 rounded-xl">
            <p className="text-xs font-bold text-yellow-400 text-center px-4">Drag seeds here to work on them</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {activeSeeds.map(seed => {
              const isSelected = seed.id === selectedTaskId;
              const focusDisplay = formatFocusTime(seed.focusTime || 0);
              return (
                <div
                  key={seed.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, seed.id)}
                  className={`bg-white p-3 rounded-xl border shadow-sm flex items-start justify-between group cursor-grab active:cursor-grabbing transition-all ${
                    isSelected ? 'border-red-300 ring-2 ring-red-100 bg-red-50/20' : 'border-yellow-200'
                  }`}
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <button
                      onClick={() => onToggle(seed.id)}
                      className="w-5 h-5 mt-0.5 flex-shrink-0 rounded-full border-2 border-yellow-400 text-transparent hover:bg-yellow-100 flex items-center justify-center transition-all"
                      title="Harvest (Complete)"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-yellow-600 opacity-0 hover:opacity-100" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => onSelectTask(isSelected ? null : seed.id)}
                      title={isSelected ? "Deselect task (stop tracking time)" : "Select to track focus time"}
                    >
                      <span className="font-bold text-stone-800 text-sm break-words">{seed.text}</span>
                      {isSelected && (
                        <div className="mt-1 flex items-center gap-1.5">
                          <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">
                            🎯 {focusDisplay ? `⏱ ${focusDisplay}` : 'Tracking...'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                    <span className="text-xs" title="Priority">{getSunIcon(seed.priority)}</span>
                    <button onClick={() => onMove(seed.id, 'backlog')} className="text-stone-300 hover:text-stone-500 p-1" title="Move back to packet">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom: The Seed Packet (Backlog) */}
      <div
        className="tomato-card p-6 border-stone-50 bg-white flex flex-col flex-1 min-h-0"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDropOnPacket}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-black text-stone-800 flex items-center gap-2">
            <span>🌱</span> Seed Packet
          </h3>
          <div className="flex items-center gap-3">
            {archivedCount > 0 && (
              <button
                onClick={onViewArchive}
                className="text-[10px] font-bold text-stone-400 hover:text-green-600 uppercase tracking-widest transition-colors"
              >
                📦 Previous ({archivedCount})
              </button>
            )}
            {seeds.length > 0 && (
              <button
                onClick={onClear}
                className="text-[10px] font-bold text-red-400 hover:text-red-600 uppercase tracking-widest transition-colors"
              >
                Clear Patch
              </button>
            )}
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="mb-4 flex flex-col gap-2 bg-stone-50 p-3 rounded-2xl border border-stone-100">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsBatchMode(!isBatchMode)}
              className={`p-2 rounded-xl border-2 transition-all ${isBatchMode ? 'bg-stone-800 text-white border-stone-800' : 'bg-white text-stone-400 border-stone-200 hover:border-stone-300'}`}
              title={isBatchMode ? "Switch to single item mode" : "Switch to batch mode (paste list)"}
            >
              {isBatchMode ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM9 15a1 1 0 011-1h6a1 1 0 110 2h-6a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
              )}
            </button>

            {isBatchMode ? (
              <textarea
                value={newSeedText}
                onChange={(e) => setNewSeedText(e.target.value)}
                placeholder="Paste multiple seeds here...&#10;One per line"
                className="flex-1 bg-white border border-stone-200 rounded-xl px-3 py-2 text-sm font-bold text-stone-700 placeholder:text-stone-300 outline-none focus:border-green-400 transition-colors min-h-[80px] resize-y"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    handleSubmit(e);
                  }
                }}
              />
            ) : (
              <input
                type="text"
                value={newSeedText}
                onChange={(e) => setNewSeedText(e.target.value)}
                placeholder="New seed..."
                className="flex-1 bg-white border border-stone-200 rounded-xl px-3 py-2 text-sm font-bold text-stone-700 placeholder:text-stone-300 outline-none focus:border-green-400 transition-colors"
              />
            )}

            <button
              type="submit"
              disabled={!newSeedText.trim()}
              className="bg-green-500 text-white p-2 rounded-xl disabled:opacity-50 hover:bg-green-600 transition-colors shadow-sm active:translate-y-0.5 active:shadow-none h-fit self-start"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          {isBatchMode && <p className="text-[10px] text-stone-400 font-bold ml-12">Press Ctrl+Enter to add all</p>}

          {/* Priority Selectors */}
          <div className="flex gap-2 mt-1">
            {[
              { id: 'sun', icon: '☀️', label: 'Full Sun' },
              { id: 'partial', icon: '⛅', label: 'Partial' },
              { id: 'shade', icon: '☁️', label: 'Shade' }
            ].map(opt => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setNewSeedPriority(opt.id as any)}
                className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg text-xs font-bold transition-all ${newSeedPriority === opt.id
                  ? 'bg-white text-stone-800 shadow-sm border border-stone-200 ring-1 ring-stone-200'
                  : 'text-stone-400 hover:bg-stone-100'
                  }`}
              >
                <span>{opt.icon}</span> <span>{opt.label}</span>
              </button>
            ))}
          </div>
        </form>

        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
          {sortedBacklog.length === 0 ? (
            <div className="text-center py-8 text-stone-300">
              <p className="text-sm font-bold italic">Packet is empty.</p>
            </div>
          ) : (
            sortedBacklog.map(seed => (
              <div
                key={seed.id}
                draggable={editingId !== seed.id}
                onDragStart={(e) => handleDragStart(e, seed.id)}
                className={`group flex items-center justify-between p-3 rounded-xl border border-stone-100 hover:border-green-200 bg-white transition-all ${editingId === seed.id ? 'border-blue-300 ring-2 ring-blue-100' : 'cursor-grab active:cursor-grabbing hover:shadow-sm'}`}
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {/* Move Up Button (Mobile friendly equivalent of drag) */}
                  <button
                    onClick={() => onMove(seed.id, 'active')}
                    className="w-6 h-6 mt-0.5 flex-shrink-0 rounded-lg bg-stone-50 text-stone-300 hover:bg-green-100 hover:text-green-600 flex items-center justify-center transition-colors"
                    title="Move to Potting Bench"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                  </button>

                  <div className="flex-1 min-w-0">
                    {editingId === seed.id ? (
                      <div className="flex flex-col gap-1">
                        <input
                          ref={editInputRef}
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          onBlur={handleSaveEdit}
                          onKeyDown={handleKeyDownEdit}
                          className="w-full bg-stone-50 border-none rounded px-1 outline-none font-bold text-sm text-stone-800"
                        />
                        <div className="flex gap-1">
                          {['sun', 'partial', 'shade'].map(p => (
                            <button
                              key={p}
                              onMouseDown={() => setEditingPriority(p as any)} // mouseDown to avoid blur
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${editingPriority === p ? 'bg-stone-200 text-stone-800' : 'text-stone-300 hover:bg-stone-100'}`}
                            >
                              {getSunIcon(p)}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div
                        className="flex items-start gap-2 cursor-pointer"
                        onDoubleClick={() => handleStartEdit(seed)}
                      >
                        <span className="text-xs mt-0.5 flex-shrink-0" title="Priority">{getSunIcon(seed.priority)}</span>
                        <span className="font-bold text-sm break-words select-none text-stone-700">
                          {seed.text}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0 ml-2">
                  <button
                    onClick={() => onDelete(seed.id)}
                    className="text-stone-300 hover:text-red-400 p-1"
                    title="Dig up seed"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
