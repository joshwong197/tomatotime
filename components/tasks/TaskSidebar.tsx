import React from 'react';
import { Beast, ThreatLevel, HuntingGround } from '../../types';
import { TaskGroup } from './TaskGroup';
import { TaskRow } from './TaskRow';
import { TaskInput } from './TaskInput';

interface TaskSidebarProps {
  beasts: Beast[];
  grounds: HuntingGround[];
  selectedBeastId: string | null;
  archivedCount: number;
  // Beast actions
  onAddBeasts: (texts: string[], threat: ThreatLevel, groundsId?: string) => void;
  onEditBeast: (id: string, text: string, threat?: ThreatLevel) => void;
  onSelectBeast: (id: string | null) => void;
  onActivateBeast: (id: string) => void;
  onDeactivateBeast: (id: string) => void;
  onSlayBeast: (id: string) => void;
  onClaimEchoes: (id: string) => void;
  onReviveBeast: (id: string) => void;
  onAwaitInsight: (id: string, note?: string) => void;
  onResumeHunt: (id: string) => void;
  onAbandonBeast: (id: string) => void;
  onClearAll: () => void;
  // Ground actions
  onAddGround: (name: string) => void;
  onDeleteGround: (id: string) => void;
  // Archive
  onViewArchive: () => void;
}

const THREAT_ORDER: Record<ThreatLevel, number> = { nightmare: 0, boss: 1, beast: 2 };

export const TaskSidebar: React.FC<TaskSidebarProps> = ({
  beasts, grounds, selectedBeastId, archivedCount,
  onAddBeasts, onEditBeast, onSelectBeast,
  onActivateBeast, onDeactivateBeast, onSlayBeast, onClaimEchoes, onReviveBeast,
  onAwaitInsight, onResumeHunt, onAbandonBeast, onClearAll,
  onAddGround, onDeleteGround,
  onViewArchive,
}) => {
  const STATUS_ORDER: Record<string, number> = { active: 0, backlog: 1, on_hold: 2, done: 3 };

  const sortBeasts = (list: Beast[]) =>
    list.sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || THREAT_ORDER[a.threat] - THREAT_ORDER[b.threat]);

  // Group all beasts (not just backlog) by hunting grounds
  const grouped = new Map<string | undefined, Beast[]>();
  beasts.forEach(b => {
    const key = b.groundsId || undefined;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(b);
  });

  const ungroupedBeasts = sortBeasts(grouped.get(undefined) || []);
  const groundGroups = Array.from(grouped.entries())
    .filter(([key]) => key !== undefined)
    .map(([key, list]) => [key, sortBeasts(list)] as [string | undefined, Beast[]]);

  const renderRow = (beast: Beast) => (
    <TaskRow
      key={beast.id}
      beast={beast}
      isSelected={selectedBeastId === beast.id}
      grounds={grounds}
      onSelect={onSelectBeast}
      onEdit={onEditBeast}
      onDelete={onAbandonBeast}
      onActivate={onActivateBeast}
      onDeactivate={onDeactivateBeast}
      onSlay={onSlayBeast}
      onClaimEchoes={onClaimEchoes}
      onRevive={onReviveBeast}
      onAwaitInsight={onAwaitInsight}
      onResumeHunt={onResumeHunt}
    />
  );

  return (
    <div className="hunt-card overflow-hidden flex flex-col" style={{ maxHeight: 'calc(100vh - 200px)' }}>
      {/* Input */}
      <TaskInput grounds={grounds} onAdd={onAddBeasts} onAddGround={onAddGround} />

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto space-y-2 px-2 pb-4">
        {/* Hunting Grounds (project groups) */}
        {groundGroups.map(([groundId, groupBeasts]) => {
          const ground = grounds.find(g => g.id === groundId);
          const activeCount = groupBeasts.filter(b => b.status === 'active').length;
          return (
            <TaskGroup
              key={groundId}
              title={ground?.name || 'Unknown Grounds'}
              icon="⚑"
              count={groupBeasts.length}
              tint={activeCount > 0 ? 'bg-red-900/10' : 'bg-amber-900/5'}
              defaultExpanded={true}
            >
              {groupBeasts.map(renderRow)}
            </TaskGroup>
          );
        })}

        {/* Ungrouped beasts — Hunter's Workshop */}
        <TaskGroup
          title="Hunter's Workshop"
          icon="⚔️"
          count={ungroupedBeasts.length}
          defaultExpanded={true}
        >
          {ungroupedBeasts.length === 0 && groundGroups.length === 0 ? (
            <p className="text-xs text-zinc-600 italic px-4 py-3">No beasts recorded. Name your quarry above.</p>
          ) : (
            ungroupedBeasts.map(renderRow)
          )}
        </TaskGroup>
      </div>

      {/* Footer */}
      <div className="border-t border-zinc-800 px-4 py-3 flex items-center justify-between">
        <button
          onClick={onViewArchive}
          className="text-[10px] font-bold text-zinc-500 hover:text-red-400 uppercase tracking-widest transition-colors flex items-center gap-1"
        >
          <span>🩸</span> Blood Echoes ({archivedCount})
        </button>
        {beasts.length > 0 && (
          <button
            onClick={onClearAll}
            className="text-[10px] font-bold text-zinc-600 hover:text-red-400 uppercase tracking-widest transition-colors"
          >
            Abandon All
          </button>
        )}
      </div>
    </div>
  );
};
