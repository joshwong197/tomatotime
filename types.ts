
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
  status: 'active' | 'backlog' | 'greenhouse'; // active = potting bench, backlog = packet, greenhouse = follow-up
  focusTime: number; // seconds of accumulated focus time
  gardenBedId?: string; // optional project grouping
}

export interface ArchivedSeed {
  id: string;
  text: string;
  priority: 'sun' | 'partial' | 'shade';
  archivedAt: number;
  archiveReason: 'completed' | 'deleted';
  focusTime: number;
  gardenBedId?: string; // preserve project association
}

export interface GardenBed {
  id: string;
  name: string;
  createdAt: number;
}

export interface PlantSprite {
  id: string;
  x: number; // percentage from left (0–100)
  y: number; // percentage from top (0–100)
}
