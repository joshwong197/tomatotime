
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
  startTime?: number; // timestamp
  endTime?: number; // timestamp
  seedId?: string;
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
  seedId?: string;
}

export interface Seed {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
  priority: 'sun' | 'partial' | 'shade'; // sun = high, partial = medium, shade = low
  status: 'active' | 'backlog'; // active = potting bench, backlog = packet
}
