import React, { useState } from 'react';

interface TaskGroupProps {
  title: string;
  icon: string;
  count: number;
  maxCount?: number;
  tint?: string; // tailwind color class for subtle background
  defaultExpanded?: boolean;
  children: React.ReactNode;
}

export const TaskGroup: React.FC<TaskGroupProps> = ({
  title, icon, count, maxCount, tint, defaultExpanded = true, children,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className={`rounded-xl overflow-hidden ${tint || ''}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-zinc-800/30 transition-colors"
      >
        <span className="text-lg">{icon}</span>
        <span className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em] flex-1 font-gothic">
          {title}
        </span>
        <span className="text-[10px] font-bold text-zinc-600">
          {maxCount ? `${count}/${maxCount}` : count > 0 ? count : ''}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-4 w-4 text-zinc-600 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
      {expanded && (
        <div className="px-2 pb-3 space-y-1">
          {children}
        </div>
      )}
    </div>
  );
};
