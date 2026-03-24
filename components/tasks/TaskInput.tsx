import React, { useState } from 'react';
import { ThreatLevel, HuntingGround } from '../../types';

const THREAT_ICONS: Record<ThreatLevel, string> = {
  nightmare: '💀',
  boss: '👹',
  beast: '🐺',
};

interface TaskInputProps {
  grounds: HuntingGround[];
  onAdd: (texts: string[], threat: ThreatLevel, groundsId?: string) => void;
  onAddGround: (name: string) => void;
}

export const TaskInput: React.FC<TaskInputProps> = ({ grounds, onAdd, onAddGround }) => {
  const [text, setText] = useState('');
  const [batchMode, setBatchMode] = useState(false);
  const [threat, setThreat] = useState<ThreatLevel>('boss');
  const [selectedGround, setSelectedGround] = useState<string>('');
  const [showNewGround, setShowNewGround] = useState(false);
  const [newGroundName, setNewGroundName] = useState('');

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    if (batchMode) {
      const lines = trimmed.split('\n').map(l => l.trim()).filter(Boolean);
      onAdd(lines, threat, selectedGround || undefined);
    } else {
      onAdd([trimmed], threat, selectedGround || undefined);
    }
    setText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (batchMode) {
      if (e.key === 'Enter' && e.ctrlKey) {
        e.preventDefault();
        handleSubmit();
      }
    } else {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      }
    }
  };

  return (
    <div className="space-y-3 p-4">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          {batchMode ? (
            <textarea
              className="hunt-input w-full px-3 py-2 text-sm resize-none"
              rows={3}
              placeholder="One beast per line... (Ctrl+Enter to add)"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          ) : (
            <input
              className="hunt-input w-full px-3 py-2 text-sm"
              placeholder="Name your quarry..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          )}
        </div>
        <button
          onClick={handleSubmit}
          disabled={!text.trim()}
          className="hunt-button px-4 py-2 text-sm font-bold disabled:opacity-30 disabled:cursor-not-allowed"
        >
          +
        </button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {/* Threat level selector */}
        <div className="flex items-center gap-1">
          {(['nightmare', 'boss', 'beast'] as ThreatLevel[]).map(t => (
            <button
              key={t}
              onClick={() => setThreat(t)}
              className={`text-lg p-1.5 rounded-lg transition-all ${
                threat === t
                  ? 'bg-zinc-700 ring-1 ring-red-500/50'
                  : 'opacity-40 hover:opacity-80'
              }`}
              title={t.charAt(0).toUpperCase() + t.slice(1)}
            >
              {THREAT_ICONS[t]}
            </button>
          ))}
        </div>

        {/* Hunting ground selector */}
        <div className="flex items-center gap-1">
          <select
            value={selectedGround}
            onChange={(e) => setSelectedGround(e.target.value)}
            className="hunt-input text-xs px-2 py-1.5 rounded-lg"
          >
            <option value="">No grounds</option>
            {grounds.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
          <button
            onClick={() => setShowNewGround(!showNewGround)}
            className={`text-xs px-2 py-1.5 rounded-lg font-bold transition-all ${
              showNewGround ? 'bg-zinc-700 text-zinc-300' : 'text-zinc-600 hover:text-zinc-400'
            }`}
            title="Add new hunting ground"
          >
            + Ground
          </button>
        </div>
        {showNewGround && (
          <div className="flex items-center gap-1 w-full">
            <input
              className="hunt-input flex-1 px-2 py-1.5 text-xs rounded-lg"
              placeholder="New ground name..."
              value={newGroundName}
              onChange={(e) => setNewGroundName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newGroundName.trim()) {
                  onAddGround(newGroundName.trim());
                  setNewGroundName('');
                  setShowNewGround(false);
                }
              }}
              autoFocus
            />
            <button
              onClick={() => {
                if (newGroundName.trim()) {
                  onAddGround(newGroundName.trim());
                  setNewGroundName('');
                  setShowNewGround(false);
                }
              }}
              disabled={!newGroundName.trim()}
              className="hunt-button px-2 py-1.5 text-xs font-bold disabled:opacity-30"
            >
              Add
            </button>
          </div>
        )}

        {/* Batch toggle */}
        <button
          onClick={() => setBatchMode(!batchMode)}
          className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg transition-all ${
            batchMode ? 'bg-zinc-700 text-zinc-300' : 'text-zinc-600 hover:text-zinc-400'
          }`}
        >
          {batchMode ? 'Batch On' : 'Batch'}
        </button>
      </div>
    </div>
  );
};
