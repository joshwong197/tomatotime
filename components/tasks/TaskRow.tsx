import React, { useState } from 'react';
import { Beast, ThreatLevel, HuntingGround } from '../../types';

const THREAT_ICONS: Record<ThreatLevel, string> = {
  nightmare: '💀',
  boss: '👹',
  beast: '🐺',
};

const formatHuntTime = (seconds: number): string => {
  if (seconds === 0) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};

interface TaskRowProps {
  beast: Beast;
  isSelected: boolean;
  grounds?: HuntingGround[];
  onSelect: (id: string | null) => void;
  onEdit: (id: string, text: string, threat?: ThreatLevel) => void;
  onDelete: (id: string) => void;
  // Status transitions
  onActivate?: (id: string) => void;
  onDeactivate?: (id: string) => void;
  onSlay?: (id: string) => void;
  onClaimEchoes?: (id: string) => void;
  onAwaitInsight?: (id: string, note?: string) => void;
  onResumeHunt?: (id: string) => void;
}

export const TaskRow: React.FC<TaskRowProps> = ({
  beast, isSelected, grounds, onSelect, onEdit, onDelete,
  onActivate, onDeactivate, onSlay, onClaimEchoes, onAwaitInsight, onResumeHunt,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(beast.text);
  const [editThreat, setEditThreat] = useState(beast.threat);

  const huntTimeDisplay = formatHuntTime(beast.huntTime);
  const groundName = grounds?.find(g => g.id === beast.groundsId)?.name;

  const handleDoubleClick = () => {
    setEditText(beast.text);
    setEditThreat(beast.threat);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (editText.trim()) {
      onEdit(beast.id, editText.trim(), editThreat);
    }
    setIsEditing(false);
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("application/beast-id", beast.id);
    e.dataTransfer.setData("text/plain", beast.text);
  };

  if (isEditing) {
    return (
      <div className="p-3 rounded-lg bg-zinc-800 border border-zinc-600 space-y-2">
        <input
          autoFocus
          className="hunt-input w-full px-3 py-2 text-sm"
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') setIsEditing(false); }}
        />
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {(['nightmare', 'boss', 'beast'] as ThreatLevel[]).map(t => (
              <button
                key={t}
                onClick={() => setEditThreat(t)}
                className={`text-lg p-1 rounded ${editThreat === t ? 'bg-zinc-700 ring-1 ring-red-500' : 'opacity-50 hover:opacity-100'}`}
              >
                {THREAT_ICONS[t]}
              </button>
            ))}
          </div>
          <div className="flex-1" />
          <button onClick={handleSaveEdit} className="text-xs font-bold text-emerald-400 hover:text-emerald-300">Save</button>
          <button onClick={() => setIsEditing(false)} className="text-xs font-bold text-zinc-500 hover:text-zinc-300">Cancel</button>
        </div>
      </div>
    );
  }

  const isDone = beast.status === 'done';
  const isOnHold = beast.status === 'on_hold';
  const isActive = beast.status === 'active';
  const isBacklog = beast.status === 'backlog';

  return (
    <div
      className={`group flex items-center gap-3 p-3 rounded-lg transition-all cursor-pointer ${
        isSelected
          ? 'bg-red-900/20 border border-red-800/30'
          : isDone
            ? 'bg-zinc-900/30 opacity-60'
            : isOnHold
              ? 'bg-purple-900/10 border border-purple-800/20'
              : 'hover:bg-zinc-800/50'
      }`}
      draggable={!isDone}
      onDragStart={handleDragStart}
      onClick={() => !isDone && !isOnHold && onSelect(beast.id)}
      onDoubleClick={handleDoubleClick}
    >
      {/* Status action button */}
      <div className="flex-shrink-0">
        {isActive && !isDone && (
          <button
            onClick={(e) => { e.stopPropagation(); onSlay?.(beast.id); }}
            className="w-6 h-6 rounded-full border-2 border-zinc-600 hover:border-red-500 hover:bg-red-900/30 flex items-center justify-center transition-all group/btn"
            title="Mark as slain"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-transparent group-hover/btn:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </button>
        )}
        {isDone && (
          <button
            onClick={(e) => { e.stopPropagation(); onClaimEchoes?.(beast.id); }}
            className="w-6 h-6 rounded-full bg-red-900/40 border border-red-700 flex items-center justify-center hover:bg-red-800/60 transition-all"
            title="Claim Blood Echoes"
          >
            <span className="text-xs">🩸</span>
          </button>
        )}
        {isOnHold && (
          <button
            onClick={(e) => { e.stopPropagation(); onResumeHunt?.(beast.id); }}
            className="w-6 h-6 rounded-full bg-purple-900/30 border border-purple-700/50 flex items-center justify-center hover:bg-purple-800/40 transition-all"
            title="Resume hunt"
          >
            <span className="text-xs">▶</span>
          </button>
        )}
        {isBacklog && (
          <button
            onClick={(e) => { e.stopPropagation(); onActivate?.(beast.id); }}
            className="w-6 h-6 rounded-full border-2 border-zinc-700 hover:border-amber-500 hover:bg-amber-900/20 flex items-center justify-center transition-all"
            title="Prepare for hunt"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-zinc-600 hover:text-amber-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>

      {/* Text + metadata */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-bold truncate ${isDone ? 'line-through text-zinc-600' : 'text-zinc-200'}`}>
          {beast.text}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs">{THREAT_ICONS[beast.threat]}</span>
          {huntTimeDisplay && (
            <span className="text-[10px] text-red-400 font-bold">⏱ {huntTimeDisplay}</span>
          )}
          {groundName && (
            <span className="text-[10px] text-amber-500/70 font-bold">⚑ {groundName}</span>
          )}
          {isOnHold && beast.insightNote && (
            <span className="text-[10px] text-purple-400/70 font-bold italic truncate" title={beast.insightNote}>
              👁 {beast.insightNote}
            </span>
          )}
          {isSelected && (
            <span className="text-[10px] bg-red-900/40 text-red-300 px-1.5 py-0.5 rounded font-bold">🎯 Tracking</span>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        {isActive && !isDone && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); onAwaitInsight?.(beast.id); }}
              className="p-1 text-zinc-600 hover:text-purple-400 transition-colors"
              title="Await Insight (hold)"
            >
              <span className="text-xs">👁</span>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDeactivate?.(beast.id); }}
              className="p-1 text-zinc-600 hover:text-amber-400 transition-colors"
              title="Return to notes"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(beast.id); }}
          className="p-1 text-zinc-600 hover:text-red-400 transition-colors"
          title="Abandon"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
};
