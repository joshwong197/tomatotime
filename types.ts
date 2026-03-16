
export enum SessionType {
  FOCUS = 'FOCUS',
  SHORT_BREAK = 'SHORT_BREAK',
  LONG_BREAK = 'LONG_BREAK'
}

export interface Session {
  id: string;
  type: SessionType;
  durationMinutes: number;
  label: string;
  startTime?: number;
  endTime?: number;
  beastId?: string;
}

export interface PomodoroSchedule {
  totalEstimatedMinutes: number;
  sessions: Session[];
}

export interface DailyStats {
  date: string;
  focusMinutes: number;
  completedSessions: number;
  pauseSeconds: number;
}

export interface CompletedSession {
  id: string;
  date: string;
  label: string;
  type: SessionType;
  startTime: number;
  endTime: number;
  durationMinutes: number;
  beastId?: string;
}

export type BeastStatus = 'backlog' | 'active' | 'on_hold' | 'done';
export type ThreatLevel = 'nightmare' | 'boss' | 'beast';

export interface Beast {
  id: string;
  text: string;
  status: BeastStatus;
  threat: ThreatLevel;
  createdAt: number;
  huntTime: number; // seconds of accumulated focus time
  groundsId?: string; // hunting ground (project) grouping
  insightNote?: string; // reason when on_hold
  slainAt?: number; // timestamp when marked done
}

export interface SlainBeast {
  id: string;
  text: string;
  threat: ThreatLevel;
  archivedAt: number;
  fate: 'slain' | 'abandoned';
  huntTime: number;
  groundsId?: string;
}

export interface HuntingGround {
  id: string;
  name: string;
  createdAt: number;
  color?: string;
}
