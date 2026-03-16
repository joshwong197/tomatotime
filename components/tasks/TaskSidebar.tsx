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
  onActivateBeast, onDeactivateBeast, onSlayBeast, onClaimEchoes,
  onAwaitInsight, onResumeHunt, onAbandonBeast, onClearAll,
  onAddGround, onDeleteGround,
  onViewArchive,
}) => {
  const activeBeasts = beasts.filter(b => b.status === 'active' || b.status === 'done')
    .sort((a, b) => {
      // Done beasts at bottom of active section
      if (a.status === 'done' && b.status !== 'done') return 1;
      if (b.status === 'done' && a.status !== 'done') return -1;
      return THREAT_ORDER[a.threat] - THREAT_ORDER[b.threat];
    });
  const onHoldBeasts = beasts.filter(b => b.status === 'on_hold')
    .sort((a, b) => THREAT_ORDER[a.threat] - THREAT_ORDER[b.threat]);
  const backlogBeasts = beasts.filter(b => b.status === 'backlog')
    .sort((a, b) => THREAT_ORDER[a.threat] - THREAT_ORDER[b.threat]);

  // Group backlog by hunting grounds
  const groupedBacklog = new Map<string | undefined, Beast[]>();
  backlogBeasts.forEach(b => {
    const key = b.groundsId || undefined;
    if (!groupedBacklog.has(key)) groupedBacklog.set(key, []);
    groupedBacklog.get(key)!.push(b);
  });

  const ungroupedBacklog = groupedBacklog.get(undefined) || [];
  const groundGroups = Array.from(groupedBacklog.entries()).filter(([key]) => key !== undefined);

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
        {/* Hunter's Workshop (active + done) */}
        <TaskGroup
          title="Hunter's Workshop"
          icon="⚔️"
          count={activeBeasts.filter(b => b.status === 'active').length}
          maxCount={5}
          tint="bg-red-900/10"
          defaultExpanded={true}
        >
          {activeBeasts.length === 0 ? (
            <p className="text-xs text-zinc-600 italic px-4 py-3">No beasts prepared. Add from your notes below.</p>
          ) : (
            activeBeasts.map(renderRow)
          )}
        </TaskGroup>

        {/* Awaiting Insight (on_hold) */}
        {onHoldBeasts.length > 0 && (
          <TaskGroup
            title="Awaiting Insight"
            icon="👁"
            count={onHoldBeasts.length}
            tint="bg-purple-900/10"
            defaultExpanded={true}
          >
            {onHoldBeasts.map(renderRow)}
          </TaskGroup>
        )}

        {/* Hunting Grounds (project groups) */}
        {groundGroups.map(([groundId, groupBeasts]) => {
          const ground = grounds.find(g => g.id === groundId);
          return (
            <TaskGroup
              key={groundId}
              title={ground?.name || 'Unknown Grounds'}
              icon="⚑"
              count={groupBeasts.length}
              tint="bg-amber-900/5"
              defaultExpanded={false}
            >
              {groupBeasts.map(renderRow)}
            </TaskGroup>
          );
        })}

        {/* Ungrouped backlog */}
        <TaskGroup
          title="Hunter's Notes"
          icon="📜"
          count={ungroupedBacklog.length}
          defaultExpanded={groundGroups.length === 0}
        >
          {ungroupedBacklog.length === 0 && groundGroups.length === 0 ? (
            <p className="text-xs text-zinc-600 italic px-4 py-3">No beasts recorded. Name your quarry above.</p>
          ) : (
            ungroupedBacklog.map(renderRow)
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
