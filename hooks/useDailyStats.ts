import { useEffect, useRef, useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { DailyStats, CompletedSession } from '../types';

export function useDailyStats() {
  const today = new Date().toDateString();
  const [dailyStats, setDailyStats] = useLocalStorage<DailyStats>('tomato_stats', {
    date: today, focusMinutes: 0, completedSessions: 0, pauseSeconds: 0
  });

  const [history, setHistory] = useLocalStorage<CompletedSession[]>('tomato_history', []);

  const pauseTimerRef = useRef<any>(null);

  // Reset daily stats if date changed
  useEffect(() => {
    const today = new Date().toDateString();
    if (dailyStats.date !== today) {
      setDailyStats({ date: today, focusMinutes: 0, completedSessions: 0, pauseSeconds: 0 });
    }
  }, []);

  const startPauseTracking = useCallback(() => {
    if (pauseTimerRef.current) clearInterval(pauseTimerRef.current);
    pauseTimerRef.current = setInterval(() => {
      setDailyStats(prev => ({ ...prev, pauseSeconds: prev.pauseSeconds + 1 }));
    }, 1000);
  }, [setDailyStats]);

  const stopPauseTracking = useCallback(() => {
    if (pauseTimerRef.current) {
      clearInterval(pauseTimerRef.current);
      pauseTimerRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => { if (pauseTimerRef.current) clearInterval(pauseTimerRef.current); };
  }, []);

  const recordSession = useCallback((session: CompletedSession, isFocus: boolean, durationMinutes: number) => {
    setHistory(prev => [session, ...prev]);
    if (isFocus) {
      setDailyStats(prev => ({
        ...prev,
        focusMinutes: prev.focusMinutes + durationMinutes,
        completedSessions: prev.completedSessions + 1,
      }));
    }
  }, [setHistory, setDailyStats]);

  const loadRemote = useCallback((remoteStats: DailyStats, remoteHistory: CompletedSession[]) => {
    if (remoteStats && remoteStats.date) setDailyStats(remoteStats);
    if (remoteHistory) setHistory(remoteHistory);
  }, [setDailyStats, setHistory]);

  return {
    dailyStats,
    history,
    recordSession,
    loadRemote,
    startPauseTracking,
    stopPauseTracking,
  };
}
