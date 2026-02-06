
import React, { useState, useRef, useEffect } from 'react';
import { Seed } from '../types';

interface SeedChecklistProps {
  seeds: Seed[];
  onAdd: (texts: string[]) => void;
  onEdit: (id: string, text: string) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
}

export const SeedChecklist: React.FC<SeedChecklistProps> = ({ seeds, onAdd, onEdit, onToggle, onDelete, onClear }) => {
  const [newSeedText, setNewSeedText] = useState('');
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
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
        if (tasks.length > 0) onAdd(tasks);
      } else {
        onAdd([newSeedText.trim()]);
      }
      setNewSeedText('');
      setIsBatchMode(false);
    }
  };

  const handleStartEdit = (seed: Seed) => {
    setEditingId(seed.id);
    setEditingText(seed.text);
  };

  const handleSaveEdit = () => {
    if (editingId && editingText.trim()) {
      onEdit(editingId, editingText.trim());
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

  const handleDragStart = (e: React.DragEvent, text: string) => {
    e.dataTransfer.setData("text/plain", text);
    e.dataTransfer.effectAllowed = "copy";
  };

  const sortedSeeds = [...seeds].sort((a, b) => {
    if (a.completed === b.completed) return 0;
    return a.completed ? 1 : -1;
  });

  return (
    <div className="tomato-card p-6 border-stone-50 bg-white flex flex-col h-full max-h-[500px]">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-black text-stone-800 flex items-center gap-2">
          <span>🌱</span> Seeds to Plant
        </h3>
        {seeds.length > 0 && (
          <button 
            onClick={onClear}
            className="text-[10px] font-bold text-red-400 hover:text-red-600 uppercase tracking-widest transition-colors"
          >
            Clear Patch
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="mb-4 flex flex-col gap-2">
        <div className="flex gap-2">
            <button
                type="button"
                onClick={() => setIsBatchMode(!isBatchMode)}
                className={`p-2 rounded-xl border-2 transition-all ${isBatchMode ? 'bg-stone-800 text-white border-stone-800' : 'bg-stone-100 text-stone-400 border-stone-200 hover:border-stone-300'}`}
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
                    placeholder="Paste multiple tasks here...&#10;One per line"
                    className="flex-1 bg-stone-50 border-2 border-stone-200 rounded-xl px-3 py-2 text-sm font-bold text-stone-700 placeholder:text-stone-300 outline-none focus:border-green-400 transition-colors min-h-[80px] resize-y"
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
                    placeholder="New task..."
                    className="flex-1 bg-stone-50 border-2 border-stone-200 rounded-xl px-3 py-2 text-sm font-bold text-stone-700 placeholder:text-stone-300 outline-none focus:border-green-400 transition-colors"
                />
            )}

            <button 
                type="submit"
                disabled={!newSeedText.trim()}
                className="bg-green-500 text-white p-2 rounded-xl disabled:opacity-50 hover:bg-green-600 transition-colors shadow-[0_2px_0_0_#15803d] active:translate-y-0.5 active:shadow-none h-fit self-start"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
            </button>
        </div>
        {isBatchMode && <p className="text-[10px] text-stone-400 font-bold ml-12">Press Ctrl+Enter to add all</p>}
      </form>

      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
        {sortedSeeds.length === 0 ? (
          <div className="text-center py-8 text-stone-300">
            <p className="text-sm font-bold italic">Your garden bed is empty.</p>
            <p className="text-xs">Add a seed to get started!</p>
          </div>
        ) : (
          sortedSeeds.map(seed => (
            <div 
              key={seed.id}
              draggable={!seed.completed && editingId !== seed.id}
              onDragStart={(e) => handleDragStart(e, seed.text)}
              className={`group flex items-center justify-between p-3 rounded-xl border-2 transition-all ${seed.completed ? 'bg-stone-50 border-stone-100' : 'bg-white border-green-50 hover:border-green-100'} ${editingId === seed.id ? 'border-blue-300 ring-2 ring-blue-100' : 'cursor-grab active:cursor-grabbing'}`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <button
                  onClick={() => onToggle(seed.id)}
                  disabled={!!editingId}
                  className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${seed.completed ? 'bg-green-100 border-green-200 text-green-600' : 'border-stone-200 text-transparent hover:border-green-300'} ${editingId ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                
                {editingId === seed.id ? (
                    <input 
                        ref={editInputRef}
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        onBlur={handleSaveEdit}
                        onKeyDown={handleKeyDownEdit}
                        className="flex-1 bg-transparent border-none outline-none font-bold text-sm text-stone-800"
                    />
                ) : (
                    <span 
                        className={`font-bold text-sm truncate select-none ${seed.completed ? 'text-stone-400 line-through' : 'text-stone-700'}`}
                        onDoubleClick={() => !seed.completed && handleStartEdit(seed)}
                        title="Double-click to edit"
                    >
                        {seed.text}
                    </span>
                )}
              </div>
              
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                  {!seed.completed && !editingId && (
                      <button 
                        onClick={() => handleStartEdit(seed)}
                        className="text-stone-300 hover:text-blue-400 p-1"
                        title="Edit seed"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                  )}
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
  );
};
