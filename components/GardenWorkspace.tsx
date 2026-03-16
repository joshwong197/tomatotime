import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Seed, GardenBed } from '../types';

interface GardenWorkspaceProps {
  seeds: Seed[];
  gardenBeds: GardenBed[];
  onMove: (id: string, status: 'active' | 'backlog') => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, text: string, priority?: 'sun' | 'partial' | 'shade') => void;
  onAssignGardenBed: (seedId: string, bedId: string | undefined) => void;
  onAddGardenBed: (name: string) => void;
  onEditGardenBed: (id: string, name: string) => void;
  onDeleteGardenBed: (id: string) => void;
  onUpdateGardenBedPosition: (id: string, x: number, y: number) => void;
  selectedTaskId: string | null;
  onSelectTask: (id: string | null) => void;
  onCompleteBedSeed: (id: string) => void;
  onUncompleteBedSeed: (id: string) => void;
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
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const BED_WIDTH = 240;
const BED_MIN_HEIGHT = 120;

export const GardenWorkspace: React.FC<GardenWorkspaceProps> = ({
  seeds, gardenBeds, onMove, onDelete, onEdit, onAssignGardenBed,
  onAddGardenBed, onEditGardenBed, onDeleteGardenBed, onUpdateGardenBedPosition,
  selectedTaskId, onSelectTask, onCompleteBedSeed, onUncompleteBedSeed
}) => {
  const workspaceRef = useRef<HTMLDivElement>(null);
  const [draggingBedId, setDraggingBedId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [seedDragOverBed, setSeedDragOverBed] = useState<string | null>(null);

  // New bed creation
  const [isAddingBed, setIsAddingBed] = useState(false);
  const [newBedName, setNewBedName] = useState('');
  const newBedInputRef = useRef<HTMLInputElement>(null);

  // Bed rename
  const [editingBedId, setEditingBedId] = useState<string | null>(null);
  const [editingBedName, setEditingBedName] = useState('');
  const editBedInputRef = useRef<HTMLInputElement>(null);

  // Seed editing
  const [editingSeedId, setEditingSeedId] = useState<string | null>(null);
  const [editingSeedText, setEditingSeedText] = useState('');
  const [editingSeedPriority, setEditingSeedPriority] = useState<'sun' | 'partial' | 'shade'>('partial');
  const editSeedInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAddingBed && newBedInputRef.current) newBedInputRef.current.focus();
  }, [isAddingBed]);

  useEffect(() => {
    if (editingBedId && editBedInputRef.current) editBedInputRef.current.focus();
  }, [editingBedId]);

  useEffect(() => {
    if (editingSeedId && editSeedInputRef.current) editSeedInputRef.current.focus();
  }, [editingSeedId]);

  // Include both active and completed seeds in beds (completed show as strikethrough)
  const seedsForBed = (bedId: string) => seeds
    .filter(s => s.gardenBedId === bedId && s.status === 'backlog')
    .sort((a, b) => {
      // Completed seeds go to bottom
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      const pMap: Record<string, number> = { sun: 3, partial: 2, shade: 1 };
      return (pMap[b.priority] || 2) - (pMap[a.priority] || 2) || b.createdAt - a.createdAt;
    });

  // Default grid positions for beds that don't have saved positions
  const getBedPosition = (bed: GardenBed, index: number) => {
    if (bed.x !== undefined && bed.y !== undefined) {
      return { x: bed.x, y: bed.y };
    }
    const col = index % 3;
    const row = Math.floor(index / 3);
    return {
      x: 20 + col * (BED_WIDTH + 24),
      y: 20 + row * 200
    };
  };

  // --- Bed dragging (mouse events for repositioning) ---
  const handleBedMouseDown = useCallback((e: React.MouseEvent, bedId: string) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('[data-no-drag]')) return;

    e.preventDefault();
    const workspace = workspaceRef.current;
    if (!workspace) return;

    const rect = workspace.getBoundingClientRect();
    const bed = gardenBeds.find(b => b.id === bedId);
    if (!bed) return;

    const bedIndex = gardenBeds.indexOf(bed);
    const pos = getBedPosition(bed, bedIndex);

    setDraggingBedId(bedId);
    setDragOffset({
      x: e.clientX - rect.left - pos.x,
      y: e.clientY - rect.top - pos.y
    });
    setDragPos(pos);
  }, [gardenBeds]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!draggingBedId || !workspaceRef.current) return;
    const rect = workspaceRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left - dragOffset.x, rect.width - BED_WIDTH));
    const y = Math.max(0, e.clientY - rect.top - dragOffset.y);
    setDragPos({ x, y });
  }, [draggingBedId, dragOffset]);

  const handleMouseUp = useCallback(() => {
    if (draggingBedId) {
      onUpdateGardenBedPosition(draggingBedId, dragPos.x, dragPos.y);
      setDraggingBedId(null);
    }
  }, [draggingBedId, dragPos, onUpdateGardenBedPosition]);

  useEffect(() => {
    if (draggingBedId) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggingBedId, handleMouseMove, handleMouseUp]);

  // --- Seed drag (HTML5 drag for transferring seeds between sections) ---
  const handleSeedDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("application/tomato-seed", id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleSeedDropOnBed = (e: React.DragEvent, bedId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSeedDragOverBed(null);
    const seedId = e.dataTransfer.getData("application/tomato-seed");
    if (seedId) {
      onMove(seedId, 'backlog');
      onAssignGardenBed(seedId, bedId);
    }
  };

  const handleWorkspaceDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setSeedDragOverBed(null);
  };

  const handleSaveBed = () => {
    if (newBedName.trim()) {
      onAddGardenBed(newBedName.trim());
      setNewBedName('');
    }
    setIsAddingBed(false);
  };

  const handleSaveEditBed = () => {
    if (editingBedId && editingBedName.trim()) {
      onEditGardenBed(editingBedId, editingBedName.trim());
    }
    setEditingBedId(null);
    setEditingBedName('');
  };

  const handleSaveSeedEdit = () => {
    if (editingSeedId && editingSeedText.trim()) {
      onEdit(editingSeedId, editingSeedText.trim(), editingSeedPriority);
    }
    setEditingSeedId(null);
    setEditingSeedText('');
  };

  // Calculate workspace height based on bed positions
  const workspaceHeight = Math.max(
    300,
    ...gardenBeds.map((bed, i) => {
      const pos = getBedPosition(bed, i);
      const bedSeeds = seedsForBed(bed.id);
      return pos.y + BED_MIN_HEIGHT + bedSeeds.length * 44 + 40;
    })
  );

  if (gardenBeds.length === 0 && !isAddingBed) {
    return (
      <div className="mt-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-black text-stone-500 uppercase tracking-widest">🌿 Garden Workspace</h3>
        </div>
        <button
          onClick={() => setIsAddingBed(true)}
          className="w-full py-6 border-2 border-dashed border-stone-200 rounded-2xl text-sm font-bold text-stone-400 hover:border-amber-300 hover:text-amber-600 hover:bg-amber-50/30 transition-colors"
        >
          + Create your first Garden Bed
        </button>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-black text-stone-500 uppercase tracking-widest">🌿 Garden Workspace</h3>
        <div className="flex items-center gap-2">
          {isAddingBed ? (
            <input
              ref={newBedInputRef}
              value={newBedName}
              onChange={(e) => setNewBedName(e.target.value)}
              onBlur={handleSaveBed}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveBed();
                if (e.key === 'Escape') { setIsAddingBed(false); setNewBedName(''); }
              }}
              placeholder="Bed name..."
              className="bg-white border-2 border-dashed border-amber-300 rounded-xl px-3 py-1.5 text-sm font-bold text-stone-700 outline-none focus:border-amber-400 placeholder:text-stone-300 w-40"
            />
          ) : (
            <button
              onClick={() => setIsAddingBed(true)}
              className="px-3 py-1.5 border-2 border-dashed border-stone-200 rounded-xl text-xs font-bold text-stone-400 hover:border-amber-300 hover:text-amber-600 hover:bg-amber-50/30 transition-colors"
            >
              + New Bed
            </button>
          )}
        </div>
      </div>

      <div
        ref={workspaceRef}
        className="relative bg-amber-50/30 border-2 border-dashed border-amber-200/60 rounded-3xl overflow-hidden"
        style={{ minHeight: workspaceHeight, userSelect: draggingBedId ? 'none' : 'auto' }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleWorkspaceDrop}
      >
        {/* Grid dots background */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, #d4a574 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }}
        />

        {gardenBeds.map((bed, index) => {
          const pos = draggingBedId === bed.id ? dragPos : getBedPosition(bed, index);
          const bedSeeds = seedsForBed(bed.id);
          const activeCount = bedSeeds.filter(s => !s.completed).length;
          const isDraggingThis = draggingBedId === bed.id;
          const isSeedDragOver = seedDragOverBed === bed.id;

          return (
            <div
              key={bed.id}
              className={`absolute transition-shadow ${isDraggingThis ? 'z-50 shadow-2xl' : 'z-10 shadow-md'} ${isSeedDragOver ? 'ring-2 ring-amber-400' : ''}`}
              style={{
                left: pos.x,
                top: pos.y,
                width: BED_WIDTH,
                transition: isDraggingThis ? 'none' : 'box-shadow 0.2s',
              }}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setSeedDragOverBed(bed.id); }}
              onDragLeave={() => setSeedDragOverBed(null)}
              onDrop={(e) => handleSeedDropOnBed(e, bed.id)}
            >
              {/* Bed Card */}
              <div className={`bg-white rounded-2xl border-2 ${isSeedDragOver ? 'border-amber-400' : 'border-amber-200'} overflow-hidden`}>
                {/* Drag handle / header */}
                <div
                  className={`px-3 py-2.5 bg-amber-50 border-b border-amber-100 flex items-center justify-between ${isDraggingThis ? 'cursor-grabbing' : 'cursor-grab'}`}
                  onMouseDown={(e) => handleBedMouseDown(e, bed.id)}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-stone-300 flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
                      </svg>
                    </span>
                    {editingBedId === bed.id ? (
                      <input
                        ref={editBedInputRef}
                        data-no-drag
                        value={editingBedName}
                        onChange={(e) => setEditingBedName(e.target.value)}
                        onBlur={handleSaveEditBed}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEditBed();
                          if (e.key === 'Escape') { setEditingBedId(null); setEditingBedName(''); }
                        }}
                        className="text-xs font-black text-amber-800 uppercase tracking-widest bg-white border border-amber-300 rounded px-1.5 py-0.5 outline-none flex-1 min-w-0"
                      />
                    ) : (
                      <span
                        className="text-xs font-black text-amber-800 uppercase tracking-widest truncate"
                        onDoubleClick={() => { setEditingBedId(bed.id); setEditingBedName(bed.name); }}
                        title="Double-click to rename"
                      >
                        🌿 {bed.name}
                      </span>
                    )}
                    <span className="text-[9px] bg-amber-200 text-amber-700 px-1.5 py-0.5 rounded-full font-bold flex-shrink-0">{activeCount}/{bedSeeds.length}</span>
                  </div>
                  <button
                    onClick={() => {
                      if (window.confirm(`Remove "${bed.name}"? Seeds will move to Seed Packet.`)) {
                        onDeleteGardenBed(bed.id);
                      }
                    }}
                    className="text-stone-300 hover:text-red-400 p-0.5 transition-colors flex-shrink-0 ml-1"
                    title="Remove bed"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Seeds list */}
                <div className="p-2 space-y-1.5" style={{ minHeight: BED_MIN_HEIGHT - 44 }}>
                  {bedSeeds.length === 0 ? (
                    <div className="flex items-center justify-center py-4">
                      <p className="text-[11px] font-bold text-amber-300 italic">Drop seeds here</p>
                    </div>
                  ) : (
                    bedSeeds.map(seed => {
                      const isSelected = seed.id === selectedTaskId;
                      const focusDisplay = formatFocusTime(seed.focusTime || 0);
                      const isCompleted = seed.completed;

                      return (
                        <div
                          key={seed.id}
                          draggable={editingSeedId !== seed.id && !isCompleted}
                          onDragStart={(e) => handleSeedDragStart(e, seed.id)}
                          data-no-drag
                          className={`group flex items-center justify-between px-2.5 py-2 rounded-xl border transition-all text-xs ${
                            isCompleted
                              ? 'border-stone-100 bg-stone-50/50'
                              : isSelected
                                ? 'border-red-300 ring-1 ring-red-100 bg-red-50/20 cursor-pointer'
                                : 'border-stone-100 hover:border-amber-200 bg-white cursor-grab active:cursor-grabbing hover:shadow-sm'
                          }`}
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {/* Completion circle */}
                            <button
                              onClick={() => isCompleted ? onUncompleteBedSeed(seed.id) : onCompleteBedSeed(seed.id)}
                              className={`w-4 h-4 flex-shrink-0 rounded-full border-2 flex items-center justify-center transition-all ${
                                isCompleted
                                  ? 'border-green-400 bg-green-400 text-white'
                                  : 'border-amber-300 text-transparent hover:bg-amber-50'
                              }`}
                              title={isCompleted ? "Mark incomplete" : "Mark complete"}
                            >
                              {isCompleted && (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </button>

                            {editingSeedId === seed.id ? (
                              <div className="flex-1 min-w-0 flex flex-col gap-1" data-no-drag>
                                <input
                                  ref={editSeedInputRef}
                                  value={editingSeedText}
                                  onChange={(e) => setEditingSeedText(e.target.value)}
                                  onBlur={handleSaveSeedEdit}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveSeedEdit();
                                    if (e.key === 'Escape') setEditingSeedId(null);
                                  }}
                                  className="w-full bg-stone-50 border-none rounded px-1 outline-none font-bold text-xs text-stone-800"
                                />
                                <div className="flex gap-1">
                                  {['sun', 'partial', 'shade'].map(p => (
                                    <button
                                      key={p}
                                      onMouseDown={() => setEditingSeedPriority(p as any)}
                                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${editingSeedPriority === p ? 'bg-stone-200 text-stone-800' : 'text-stone-300 hover:bg-stone-100'}`}
                                    >
                                      {getSunIcon(p)}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <div
                                className={`flex flex-col flex-1 min-w-0 ${!isCompleted ? 'cursor-pointer' : ''}`}
                                onClick={() => !isCompleted && onSelectTask(isSelected ? null : seed.id)}
                                onDoubleClick={() => !isCompleted && (() => { setEditingSeedId(seed.id); setEditingSeedText(seed.text); setEditingSeedPriority(seed.priority); })()}
                                title={isCompleted ? 'Completed' : isSelected ? 'Deselect (stop tracking)' : 'Click to track focus time'}
                              >
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="text-[10px] flex-shrink-0">{getSunIcon(seed.priority)}</span>
                                  <span className={`font-bold truncate select-none ${
                                    isCompleted ? 'line-through text-stone-400' : 'text-stone-700'
                                  }`}>
                                    {seed.text}
                                  </span>
                                </div>
                                {isSelected && !isCompleted && (
                                  <span className="text-[9px] font-black text-red-500 uppercase tracking-widest mt-0.5 ml-5">
                                    🎯 {focusDisplay ? `⏱ ${focusDisplay}` : 'Tracking...'}
                                  </span>
                                )}
                                {!isSelected && focusDisplay && !isCompleted && (
                                  <span className="text-[9px] text-stone-400 mt-0.5 ml-5">⏱ {focusDisplay}</span>
                                )}
                              </div>
                            )}
                          </div>

                          {!isCompleted && (
                            <button
                              onClick={() => onDelete(seed.id)}
                              className="text-stone-200 hover:text-red-400 p-0.5 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0 ml-1"
                              title="Delete"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
