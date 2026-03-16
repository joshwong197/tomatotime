import { useState, useEffect, useRef, useCallback } from 'react';
import { Session, SessionType, PomodoroSchedule, CompletedSession, Beast } from '../types';
import { audioService } from '../services/audioService';

interface UseTimerOptions {
  selectedBeast: Beast | null;
  onFocusTick: (beastId: string, elapsed: number) => void;
  onSessionComplete: (session: CompletedSession, isFocus: boolean, durationMinutes: number) => void;
}

export function useTimer({ selectedBeast, onFocusTick, onSessionComplete }: UseTimerOptions) {
  // Input state
  const [inputHours, setInputHours] = useState(0);
  const [inputMinutes, setInputMinutes] = useState(30);

  // Schedule state
  const [schedule, setSchedule] = useState<PomodoroSchedule | null>(() => {
    const saved = localStorage.getItem('tomato_active_schedule');
    return saved ? JSON.parse(saved) : null;
  });
  const [currentSessionIndex, setCurrentSessionIndex] = useState<number>(() => {
    const saved = localStorage.getItem('tomato_active_index');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [timeLeft, setTimeLeft] = useState<number>(() => {
    const saved = localStorage.getItem('tomato_active_time_left');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [isRunning, setIsRunning] = useState<boolean>(() => {
    const saved = localStorage.getItem('tomato_active_running');
    return saved === 'true';
  });
  const [targetEndTime, setTargetEndTime] = useState<number | null>(() => {
    const saved = localStorage.getItem('tomato_active_target_end');
    return saved ? parseInt(saved, 10) : null;
  });
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(() => {
    const saved = localStorage.getItem('tomato_active_session_start');
    return saved ? parseInt(saved, 10) : null;
  });

  // UI state
  const [showNotification, setShowNotification] = useState(false);
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [editingLabelText, setEditingLabelText] = useState('');
  const [ambience, setAmbience] = useState<'off' | 'rain' | 'wind'>('off');
  const [pipWindow, setPipWindow] = useState<Window | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  const timerRef = useRef<any>(null);
  const taskTimerRef = useRef<any>(null);

  const currentSession = schedule?.sessions[currentSessionIndex] ?? null;

  // Persist timer state
  useEffect(() => {
    if (schedule) localStorage.setItem('tomato_active_schedule', JSON.stringify(schedule));
    else localStorage.removeItem('tomato_active_schedule');
    localStorage.setItem('tomato_active_index', currentSessionIndex.toString());
    localStorage.setItem('tomato_active_running', isRunning.toString());
    localStorage.setItem('tomato_active_time_left', timeLeft.toString());
    if (targetEndTime) localStorage.setItem('tomato_active_target_end', targetEndTime.toString());
    else localStorage.removeItem('tomato_active_target_end');
    if (sessionStartTime) localStorage.setItem('tomato_active_session_start', sessionStartTime.toString());
    else localStorage.removeItem('tomato_active_session_start');
  }, [schedule, currentSessionIndex, isRunning, timeLeft, targetEndTime, sessionStartTime]);

  // Ambience
  useEffect(() => {
    if (ambience === 'off') {
      audioService.stopAmbience();
    } else {
      audioService.startAmbience(ambience);
    }
    return () => audioService.stopAmbience();
  }, [ambience]);

  // Notifications
  const requestNotificationPermission = async () => {
    if (typeof Notification !== 'undefined') {
      try {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
        if (permission === 'granted') {
          sendBrowserNotification("Notifications Enabled!", "You'll receive alerts even in other tabs.");
        }
      } catch (e) {
        console.error("Permission request failed", e);
      }
    }
  };

  const sendBrowserNotification = (title: string, body: string) => {
    if (typeof Notification !== 'undefined' && notificationPermission === 'granted') {
      try {
        const notification = new Notification(title, {
          body,
          tag: `tomato-${Date.now()}`,
          requireInteraction: true
        });
        notification.onclick = () => { window.focus(); notification.close(); };
      } catch (e) {
        console.error("Notification creation failed", e);
      }
    }
  };

  const triggerCompletion = useCallback(() => {
    const sessionObj = schedule?.sessions[currentSessionIndex];
    if (sessionObj) {
      const isFocus = sessionObj.type === SessionType.FOCUS;
      const title = isFocus ? '⚔️ Prey Slaughtered!' : '🌙 The Dream Beckons...';
      const body = isFocus
        ? `${sessionObj.label} hunt is complete.`
        : 'Time to return to the hunt.';
      sendBrowserNotification(title, body);
      audioService.playChime();
      audioService.stopAmbience();
    }
    setShowNotification(true);
  }, [schedule, currentSessionIndex, notificationPermission]);

  // Timer loop
  useEffect(() => {
    if (isRunning && targetEndTime) {
      const tick = () => {
        const now = Date.now();
        const remaining = Math.max(0, Math.ceil((targetEndTime - now) / 1000));
        setTimeLeft(remaining);
        if (remaining === 0) {
          setIsRunning(false);
          setTargetEndTime(null);
          triggerCompletion();
          if (timerRef.current) clearInterval(timerRef.current);
        }
      };
      tick();
      timerRef.current = setInterval(tick, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRunning, targetEndTime, triggerCompletion]);

  // Focus time tracking
  useEffect(() => {
    const isFocusSession = schedule?.sessions[currentSessionIndex]?.type === SessionType.FOCUS;
    if (isRunning && isFocusSession && selectedBeast) {
      const startedAt = Date.now();
      const baseline = selectedBeast.huntTime ?? 0;
      taskTimerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startedAt) / 1000);
        onFocusTick(selectedBeast.id, baseline + elapsed);
      }, 1000);
    } else {
      if (taskTimerRef.current) clearInterval(taskTimerRef.current);
    }
    return () => { if (taskTimerRef.current) clearInterval(taskTimerRef.current); };
  }, [isRunning, schedule, currentSessionIndex, selectedBeast?.id]);

  // Actions
  const beginHunt = useCallback(() => {
    const totalInputMinutes = (inputHours * 60) + inputMinutes;
    const actualMinutes = totalInputMinutes > 0 ? totalInputMinutes : 25;

    const newSessions: Session[] = [];
    let remaining = actualMinutes;
    let count = 0;

    while (remaining > 0) {
      count++;
      const focusDur = Math.min(25, remaining);
      newSessions.push({
        id: Math.random().toString(36).substr(2, 9),
        type: SessionType.FOCUS,
        durationMinutes: focusDur,
        label: `Hunt ${count}`
      });
      remaining -= focusDur;
      if (remaining <= 0) break;

      const isLong = count % 4 === 0;
      const breakDur = Math.min(isLong ? 15 : 5, remaining);
      newSessions.push({
        id: Math.random().toString(36).substr(2, 9),
        type: isLong ? SessionType.LONG_BREAK : SessionType.SHORT_BREAK,
        durationMinutes: breakDur,
        label: isLong ? "Hunter's Dream (Long)" : "Hunter's Dream"
      });
      remaining -= breakDur;
    }

    const newSchedule: PomodoroSchedule = {
      totalEstimatedMinutes: actualMinutes,
      sessions: newSessions
    };

    setSchedule(newSchedule);
    setCurrentSessionIndex(0);
    setTimeLeft(newSchedule.sessions[0].durationMinutes * 60);
    setIsRunning(false);
    setTargetEndTime(null);
    setSessionStartTime(null);
  }, [inputHours, inputMinutes]);

  const startTimer = useCallback(() => {
    if (!isRunning) {
      const now = Date.now();
      if (!sessionStartTime) setSessionStartTime(now);
      setTargetEndTime(now + (timeLeft * 1000));
      setIsRunning(true);
      if (ambience !== 'off') audioService.startAmbience(ambience);
    }
  }, [isRunning, sessionStartTime, timeLeft, ambience]);

  const pauseTimer = useCallback(() => {
    setIsRunning(false);
    setTargetEndTime(null);
    audioService.stopAmbience();
  }, []);

  const completeEarly = useCallback(() => {
    setIsRunning(false);
    setTargetEndTime(null);
    setTimeLeft(0);
    triggerCompletion();
  }, [triggerCompletion]);

  const nextSession = useCallback(() => {
    if (!schedule) return;

    const sessionObj = schedule.sessions[currentSessionIndex];
    const endTime = Date.now();
    const startTime = sessionStartTime || (endTime - (sessionObj.durationMinutes * 60 * 1000));

    const historyEntry: CompletedSession = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toDateString(),
      label: sessionObj.label,
      type: sessionObj.type,
      startTime,
      endTime,
      durationMinutes: sessionObj.durationMinutes,
      beastId: sessionObj.beastId,
    };

    const isFocus = sessionObj.type === SessionType.FOCUS;
    onSessionComplete(historyEntry, isFocus, sessionObj.durationMinutes);

    if (currentSessionIndex < schedule.sessions.length - 1) {
      const nextIdx = currentSessionIndex + 1;
      setCurrentSessionIndex(nextIdx);
      setTimeLeft(schedule.sessions[nextIdx].durationMinutes * 60);
      setIsRunning(false);
      setTargetEndTime(null);
      setSessionStartTime(null);
      setShowNotification(false);
    } else {
      setIsRunning(false);
      setShowNotification(false);
      setSchedule(null);
      setTargetEndTime(null);
      setSessionStartTime(null);
      localStorage.removeItem('tomato_active_schedule');
    }
  }, [currentSessionIndex, schedule, sessionStartTime, onSessionComplete]);

  const updateLabel = useCallback((newLabel?: string, beastId?: string) => {
    if (!schedule) return;
    const newSessions = [...schedule.sessions];
    newSessions[currentSessionIndex] = {
      ...newSessions[currentSessionIndex],
      label: newLabel || editingLabelText || 'Untitled Hunt',
      ...(beastId ? { beastId } : {}),
    };
    setSchedule({ ...schedule, sessions: newSessions });
    setIsEditingLabel(false);
  }, [schedule, currentSessionIndex, editingLabelText]);

  const resetHunt = useCallback(() => {
    setSchedule(null);
    setIsRunning(false);
    setTargetEndTime(null);
    localStorage.removeItem('tomato_active_schedule');
  }, []);

  // PiP
  const togglePiP = async () => {
    if (pipWindow) {
      pipWindow.close();
      setPipWindow(null);
    } else {
      if ('documentPictureInPicture' in window) {
        try {
          const pip = await (window as any).documentPictureInPicture.requestWindow({
            width: 350,
            height: 400,
          });

          [...document.styleSheets].forEach((styleSheet) => {
            try {
              if (styleSheet.href) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.type = styleSheet.type;
                link.href = styleSheet.href;
                pip.document.head.appendChild(link);
              } else {
                const cssRules = [...styleSheet.cssRules].map((rule) => rule.cssText).join('');
                const style = document.createElement('style');
                style.textContent = cssRules;
                pip.document.head.appendChild(style);
              }
            } catch (e) {
              console.warn("Could not copy stylesheet", e);
            }
          });

          const script = document.createElement('script');
          script.src = "https://cdn.tailwindcss.com";
          pip.document.head.appendChild(script);

          pip.document.body.style.fontFamily = "'Cinzel', serif";
          pip.document.body.style.backgroundColor = "#0f0f1a";
          pip.document.body.style.display = "flex";
          pip.document.body.style.justifyContent = "center";
          pip.document.body.style.alignItems = "center";

          setPipWindow(pip);
          pip.addEventListener('pagehide', () => setPipWindow(null));
        } catch (err: any) {
          if (err.message && (err.message.includes("top-level") || err.name === 'NotAllowedError')) {
            alert("Picture-in-Picture cannot be opened from inside a preview frame. Please open the app in a new tab.");
          } else {
            alert("Could not open Picture-in-Picture window.");
          }
        }
      } else {
        alert("Your browser does not support Document Picture-in-Picture API.");
      }
    }
  };

  // Input helpers
  const incrementHours = () => setInputHours(prev => Math.min(12, prev + 1));
  const decrementHours = () => setInputHours(prev => Math.max(0, prev - 1));
  const incrementMinutes = () => setInputMinutes(prev => (prev + 5) >= 60 ? 0 : prev + 5);
  const decrementMinutes = () => setInputMinutes(prev => (prev - 5) < 0 ? 55 : prev - 5);

  return {
    // State
    schedule,
    currentSession,
    currentSessionIndex,
    timeLeft,
    isRunning,
    showNotification,
    isEditingLabel,
    editingLabelText,
    ambience,
    pipWindow,
    notificationPermission,
    inputHours,
    inputMinutes,

    // Actions
    beginHunt,
    startTimer,
    pauseTimer,
    completeEarly,
    nextSession,
    updateLabel,
    resetHunt,
    togglePiP,
    setAmbience,
    setIsEditingLabel,
    setEditingLabelText,
    setShowNotification,
    requestNotificationPermission,
    setNotificationPermission,
    incrementHours,
    decrementHours,
    incrementMinutes,
    decrementMinutes,
  };
}
