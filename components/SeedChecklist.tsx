import React, { useState, useRef, useEffect } from 'react';
import { Seed, GardenBed } from '../types';

interface SeedChecklistProps {
  seeds: Seed[];
  onAdd: (texts: string[], priority: 'sun' | 'partial' | 'shade', gardenBedId?: string) => void;
  onEdit: (id: string, text: string, priority?: 'sun' | 'partial' | 'shade') => void;
  onHarvest: (id: string) => void;
  onGreenhouse: (id: string) => void;
  onGreenhouseToBacklog: (id: string) => void;
  onGreenhouseToArchive: (id: string) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, status: 'active' | 'backlog') => void;
  onClear: () => void;
  archivedCount: number;
  onViewArchive: () => void;
  selectedTaskId: string | null;
  onSelectTask: (id: string | null) => void;
  gardenBeds: GardenBed[];
  onAddGardenBed: (name: string) => void;
  onEditGardenBed: (id: string, name: string) => void;
  onDeleteGardenBed: (id: string) => void;
  onAssignGardenBed: (seedId: string, bedId: string | undefined) => void;
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
  seeds, onAdd, onEdit, onHarvest, onGreenhouse, onGreenhouseToBacklog, onGreenhouseToArchive,
  onDelete, onMove, onClear, archivedCount, onViewArchive, selectedTaskId, onSelectTask,
  gardenBeds, onAddGardenBed, onEditGardenBed, onDeleteGardenBed, onAssignGardenBed
}) => {
  const [newSeedText, setNewSeedText] = useState('');
  const [newSeedPriority, setNewSeedPriority] = useState<'sun' | 'partial' | 'shade'>('partial');
  const [newSeedBedId, setNewSeedBedId] = useState<string | undefined>(undefined);
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [editingPriority, setEditingPriority] = useState<'sun' | 'partial' | 'shade'>('partial');
  const editInputRef = useRef<HTMLInputElement>(null);

  // Completion choice state
  const [completionChoiceId, setCompletionChoiceId] = useState<string | null>(null);

  // Collapse states
  const [greenhouseCollapsed, setGreenhouseCollapsed] = useState(false);
  const [packetCollapsed, setPacketCollapsed] = useState(false);
  // Drag-over highlight
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);

  useEffect(() => {
    if (editingId && editInputRef.current) editInputRef.current.focus();
  }, [editingId]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSeedText.trim()) {
      if (isBatchMode) {
        const tasks = newSeedText.split(/\n/).map(t => t.trim()).filter(t => t.length > 0);
        if (tasks.length > 0) onAdd(tasks, newSeedPriority, newSeedBedId);
      } else {
        onAdd([newSeedText.trim()], newSeedPriority, newSeedBedId);
      }
      setNewSeedText('');
      setNewSeedPriority('partial');
      setNewSeedBedId(undefined);
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
    setDragOverTarget(null);
    const id = e.dataTransfer.getData("application/tomato-seed");
    if (id) onMove(id, 'active');
  };

  const handleDropOnPacket = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverTarget(null);
    const id = e.dataTransfer.getData("application/tomato-seed");
    if (id) {
      // Move to backlog and unassign from any garden bed
      onMove(id, 'backlog');
      onAssignGardenBed(id, undefined);
    }
  };


  const handleDragOver = (e: React.DragEvent, target: string) => {
    e.preventDefault();
    setDragOverTarget(target);
  };

  const handleDragLeave = () => {
    setDragOverTarget(null);
  };


  const getSunIcon = (p: string) => {
    switch (p) {
      case 'sun': return '☀️';
      case 'partial': return '⛅';
      case 'shade': return '☁️';
      default: return '🌱';
    }
  };

  const getBedName = (bedId?: string) => {
    if (!bedId) return null;
    return gardenBeds.find(b => b.id === bedId)?.name || null;
  };

  const activeSeeds = seeds.filter(s => s.status === 'active' && !s.completed);
  const greenhouseSeeds = seeds.filter(s => s.status === 'greenhouse');
  const backlogSeeds = seeds.filter(s => s.status === 'backlog' && !s.completed);

  // Unassigned backlog seeds (no garden bed) go in the Seed Packet
  const unassignedBacklog = backlogSeeds.filter(s => !s.gardenBedId);

  // Sort by priority: Sun > Partial > Shade, then by creation date
  const sortByPriority = (list: Seed[]) => [...list].sort((a, b) => {
    const pMap: Record<string, number> = { sun: 3, partial: 2, shade: 1 };
    const pA = pMap[a.priority || 'partial'];
    const pB = pMap[b.priority || 'partial'];
    if (pA !== pB) return pB - pA;
    return b.createdAt - a.createdAt;
  });

  const sortedUnassigned = sortByPriority(unassignedBacklog);

  // Render a single backlog/bed seed row
  const renderBacklogSeed = (seed: Seed, showBedBadge: boolean = false) => {
    const bedName = getBedName(seed.gardenBedId);
    return (
      <div
        key={seed.id}
        draggable={editingId !== seed.id}
        onDragStart={(e) => handleDragStart(e, seed.id)}
        className={`group flex items-center justify-between p-3 rounded-xl border border-stone-100 hover:border-green-200 bg-white transition-all ${editingId === seed.id ? 'border-blue-300 ring-2 ring-blue-100' : 'cursor-grab active:cursor-grabbing hover:shadow-sm'}`}
      >
        <div className="flex items-start gap-3 flex-1 min-w-0">
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
                      onMouseDown={() => setEditingPriority(p as any)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${editingPriority === p ? 'bg-stone-200 text-stone-800' : 'text-stone-300 hover:bg-stone-100'}`}
                    >
                      {getSunIcon(p)}
                    </button>
                  ))}
                </div>
                {gardenBeds.length > 0 && (
                  <select
                    value={seed.gardenBedId || ''}
                    onMouseDown={(e) => e.stopPropagation()}
                    onChange={(e) => { onAssignGardenBed(seed.id, e.target.value || undefined); }}
                    className="mt-0.5 bg-stone-50 border border-stone-200 rounded px-1 py-0.5 text-[10px] font-bold text-stone-600 outline-none"
                  >
                    <option value="">No bed</option>
                    {gardenBeds.map(bed => (
                      <option key={bed.id} value={bed.id}>🌿 {bed.name}</option>
                    ))}
                  </select>
                )}
              </div>
            ) : (
              <div
                className="flex items-start gap-2 cursor-pointer"
                onDoubleClick={() => handleStartEdit(seed)}
              >
                <span className="text-xs mt-0.5 flex-shrink-0" title="Priority">{getSunIcon(seed.priority)}</span>
                <div className="min-w-0">
                  <span className="font-bold text-sm break-words select-none text-stone-700">
                    {seed.text}
                  </span>
                  {showBedBadge && bedName && (
                    <div className="mt-0.5">
                      <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-100">
                        🌿 {bedName}
                      </span>
                    </div>
                  )}
                </div>
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
    );
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {/* === POTTING BENCH (Active / Timed Tasks) === */}
      <div
        className={`tomato-card p-4 bg-yellow-50/50 border-yellow-100 min-h-[140px] flex flex-col transition-colors ${dragOverTarget === 'bench' ? 'ring-2 ring-yellow-400 bg-yellow-100/60' : 'hover:bg-yellow-50'}`}
        onDragOver={(e) => handleDragOver(e, 'bench')}
        onDragLeave={handleDragLeave}
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
              const showingChoice = completionChoiceId === seed.id;
              const bedName = getBedName(seed.gardenBedId);
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
                    {showingChoice ? (
                      <div className="flex gap-2 w-full animate-in fade-in duration-200">
                        <button
                          onClick={() => { onHarvest(seed.id); setCompletionChoiceId(null); }}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-green-50 border border-green-200 text-green-700 hover:bg-green-100 transition-colors text-xs font-bold"
                          title="Archive as completed"
                        >
                          <span>✅</span> Harvest
                        </button>
                        <button
                          onClick={() => { onGreenhouse(seed.id); setCompletionChoiceId(null); }}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition-colors text-xs font-bold"
                          title="Move to Greenhouse for follow-up"
                        >
                          <span>🏡</span> Greenhouse
                        </button>
                        <button
                          onClick={() => setCompletionChoiceId(null)}
                          className="p-2 rounded-xl text-stone-300 hover:text-stone-500 hover:bg-stone-50 transition-colors"
                          title="Cancel"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => setCompletionChoiceId(seed.id)}
                          className="w-5 h-5 mt-0.5 flex-shrink-0 rounded-full border-2 border-yellow-400 text-transparent hover:bg-yellow-100 flex items-center justify-center transition-all"
                          title="Complete task"
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
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            {isSelected && (
                              <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">
                                🎯 {focusDisplay ? `⏱ ${focusDisplay}` : 'Tracking...'}
                              </span>
                            )}
                            {bedName && (
                              <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-100">
                                🌿 {bedName}
                              </span>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  {!showingChoice && (
                    <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                      <span className="text-xs" title="Priority">{getSunIcon(seed.priority)}</span>
                      <button onClick={() => onMove(seed.id, 'backlog')} className="text-stone-300 hover:text-stone-500 p-1" title="Move back to packet">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* === GREENHOUSE (Follow-up) === */}
      {greenhouseSeeds.length > 0 && (
        <div className="tomato-card p-4 bg-emerald-50/50 border-emerald-100 flex flex-col transition-colors">
          <button
            onClick={() => setGreenhouseCollapsed(!greenhouseCollapsed)}
            className="text-sm font-black text-emerald-800 uppercase tracking-widest mb-2 flex items-center justify-between w-full text-left hover:text-emerald-900 transition-colors"
          >
            <span>🏡 Greenhouse</span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-emerald-200 text-emerald-800 px-2 py-1 rounded-full">{greenhouseSeeds.length}</span>
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${greenhouseCollapsed ? '' : 'rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>

          {!greenhouseCollapsed && (
            <div className="grid grid-cols-1 gap-2">
              {greenhouseSeeds.map(seed => {
                const bedName = getBedName(seed.gardenBedId);
                return (
                  <div
                    key={seed.id}
                    className="bg-white p-3 rounded-xl border border-emerald-200 shadow-sm flex items-center justify-between group transition-all"
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <span className="text-xs mt-0.5 flex-shrink-0">{getSunIcon(seed.priority)}</span>
                      <div className="min-w-0">
                        <span className="font-bold text-stone-700 text-sm break-words">{seed.text}</span>
                        {bedName && (
                          <div className="mt-0.5">
                            <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-100">
                              🌿 {bedName}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                      <button
                        onClick={() => onGreenhouseToBacklog(seed.id)}
                        className="text-stone-300 hover:text-amber-600 p-1.5 rounded-lg hover:bg-amber-50 transition-colors"
                        title="Replant to Seed Packet"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                      <button
                        onClick={() => onGreenhouseToArchive(seed.id)}
                        className="text-stone-300 hover:text-green-600 p-1.5 rounded-lg hover:bg-green-50 transition-colors"
                        title="Harvest (Complete)"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* === SEED PACKET (Unassigned Backlog) === */}
      <div
        className={`tomato-card p-6 border-stone-50 bg-white flex flex-col flex-1 min-h-0 transition-colors ${dragOverTarget === 'packet' ? 'ring-2 ring-stone-400 bg-stone-50' : ''}`}
        onDragOver={(e) => handleDragOver(e, 'packet')}
        onDragLeave={handleDragLeave}
        onDrop={handleDropOnPacket}
      >
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => setPacketCollapsed(!packetCollapsed)}
            className="text-lg font-black text-stone-800 flex items-center gap-2 hover:text-stone-900 transition-colors"
          >
            <span>🌱</span> Seed Packet
            <span className="text-[10px] bg-stone-200 text-stone-600 px-2 py-0.5 rounded-full font-bold">{unassignedBacklog.length}</span>
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform text-stone-400 ${packetCollapsed ? '' : 'rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
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

        {!packetCollapsed && (
          <>
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

              {/* Garden Bed selector for new seeds */}
              {gardenBeds.length > 0 && (
                <select
                  value={newSeedBedId || ''}
                  onChange={(e) => setNewSeedBedId(e.target.value || undefined)}
                  className="mt-1 bg-white border border-stone-200 rounded-lg px-2 py-1.5 text-xs font-bold text-stone-600 outline-none focus:border-emerald-400 transition-colors"
                >
                  <option value="">No garden bed (Seed Packet)</option>
                  {gardenBeds.map(bed => (
                    <option key={bed.id} value={bed.id}>🌿 {bed.name}</option>
                  ))}
                </select>
              )}
            </form>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
              {sortedUnassigned.length === 0 ? (
                <div className="text-center py-8 text-stone-300">
                  <p className="text-sm font-bold italic">Packet is empty.</p>
                </div>
              ) : (
                sortedUnassigned.map(seed => renderBacklogSeed(seed))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
