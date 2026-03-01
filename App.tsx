
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Session, SessionType, PomodoroSchedule, DailyStats, CompletedSession, Seed, ArchivedSeed, PlantSprite } from './types';
import { TimerDisplay } from './components/TimerDisplay';
import { NotificationOverlay } from './components/NotificationOverlay';
import { HistoryHub } from './components/HistoryHub';
import { SeedChecklist } from './components/SeedChecklist';
import { AboutModal } from './components/AboutModal';
import { ArchivedSeedsModal } from './components/ArchivedSeedsModal';
import { audioService } from './services/audioService';

// Helper: hash a string id to an x/y percentage for deterministic plant placement
function hashToPercent(id: string, salt: number): number {
  let h = salt;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffff;
  return 5 + (h % 90);
}

function generatePlantPosition(existingSprites: PlantSprite[], seedId: string): { x: number; y: number } {
  // Try deterministic position first based on seed id
  const x = hashToPercent(seedId, 7);
  const y = hashToPercent(seedId, 13);
  return { x, y };
}

const STAGE_EMOJIS = ['🌱', '🌿', '🪴', '🌳'];

const PlantBackground: React.FC<{ sprites: PlantSprite[] }> = ({ sprites }) => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
    {sprites.slice(-60).map((sprite, idx) => {
      const stage = Math.min(3, Math.floor(idx / 5));
      const emoji = STAGE_EMOJIS[stage];
      const opacity = 0.12 + (stage * 0.07);
      const size = 18 + stage * 6;
      return (
        <div
          key={sprite.id}
          className="absolute select-none"
          style={{
            left: `${sprite.x}%`,
            top: `${sprite.y}%`,
            fontSize: `${size}px`,
            opacity,
            transform: 'translate(-50%, -50%)',
          }}
        >
          {emoji}
        </div>
      );
    })}
  </div>
);

const App: React.FC = () => {
  // Manual Timer Input State
  const [inputHours, setInputHours] = useState(0);
  const [inputMinutes, setInputMinutes] = useState(30);

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

  const [showNotification, setShowNotification] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [editingLabelText, setEditingLabelText] = useState('');
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  // Ambience State
  const [ambience, setAmbience] = useState<'off' | 'rain' | 'wind'>('off');

  // PiP State
  const [pipWindow, setPipWindow] = useState<Window | null>(null);

  // Checklist State
  const [seeds, setSeeds] = useState<Seed[]>(() => {
    const saved = localStorage.getItem('tomato_seeds');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Migration for old seeds
      return parsed.map((s: any) => ({
        ...s,
        priority: s.priority || 'partial',
        status: s.status || 'backlog',
        focusTime: s.focusTime || 0
      }));
    }
    return [];
  });

  // Archive State
  const [archivedSeeds, setArchivedSeeds] = useState<ArchivedSeed[]>(() => {
    const saved = localStorage.getItem('tomato_archived_seeds');
    return saved ? JSON.parse(saved) : [];
  });

  const [showArchive, setShowArchive] = useState(false);

  // Selected Task for Focus Time Tracking
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(() => {
    return localStorage.getItem('tomato_selected_task') || null;
  });

  // Garden Plant Sprites (background visuals)
  const [plantSprites, setPlantSprites] = useState<PlantSprite[]>(() => {
    const saved = localStorage.getItem('tomato_plant_sprites');
    return saved ? JSON.parse(saved) : [];
  });

  // Analytics State
  const [dailyStats, setDailyStats] = useState<DailyStats>(() => {
    const saved = localStorage.getItem('tomato_stats');
    const today = new Date().toDateString();
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.date === today) return parsed;
    }
    return { date: today, focusMinutes: 0, completedSessions: 0, pauseSeconds: 0 };
  });

  const [history, setHistory] = useState<CompletedSession[]>(() => {
    const saved = localStorage.getItem('tomato_history');
    if (saved) {
      const parsed: CompletedSession[] = JSON.parse(saved);
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return parsed.filter(s => new Date(s.date).getTime() > oneWeekAgo.getTime());
    }
    return [];
  });

  const [sessionStartTime, setSessionStartTime] = useState<number | null>(() => {
    const saved = localStorage.getItem('tomato_active_session_start');
    return saved ? parseInt(saved, 10) : null;
  });

  const timerRef = useRef<any>(null);
  const pauseTimerRef = useRef<any>(null);
  const taskTimerRef = useRef<any>(null);

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem('tomato_stats', JSON.stringify(dailyStats));
  }, [dailyStats]);

  useEffect(() => {
    localStorage.setItem('tomato_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem('tomato_seeds', JSON.stringify(seeds));
  }, [seeds]);

  useEffect(() => {
    localStorage.setItem('tomato_archived_seeds', JSON.stringify(archivedSeeds));
  }, [archivedSeeds]);

  useEffect(() => {
    localStorage.setItem('tomato_plant_sprites', JSON.stringify(plantSprites));
  }, [plantSprites]);

  useEffect(() => {
    if (selectedTaskId) localStorage.setItem('tomato_selected_task', selectedTaskId);
    else localStorage.removeItem('tomato_selected_task');
  }, [selectedTaskId]);

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

  // Track Pause Time
  useEffect(() => {
    if (!isRunning && schedule && !showNotification) {
      pauseTimerRef.current = setInterval(() => {
        setDailyStats(prev => ({ ...prev, pauseSeconds: prev.pauseSeconds + 1 }));
      }, 1000);
    } else {
      if (pauseTimerRef.current) clearInterval(pauseTimerRef.current);
    }
    return () => { if (pauseTimerRef.current) clearInterval(pauseTimerRef.current); };
  }, [isRunning, schedule, showNotification]);

  // Ambience Effect
  useEffect(() => {
    if (ambience === 'off') {
      audioService.stopAmbience();
    } else {
      audioService.startAmbience(ambience);
    }
    return () => audioService.stopAmbience(); // Cleanup on unmount
  }, [ambience]);

  // --- Checklist Handlers ---
  const handleAddSeed = (texts: string[], priority: 'sun' | 'partial' | 'shade' = 'partial') => {
    const newSeeds: Seed[] = texts.map(text => ({
      id: Math.random().toString(36).substr(2, 9),
      text,
      completed: false,
      createdAt: Date.now(),
      priority,
      status: 'backlog', // Default to backlog
      focusTime: 0
    }));
    setSeeds(prev => [...newSeeds, ...prev]);
  };

  const handleEditSeed = (id: string, newText: string, priority?: 'sun' | 'partial' | 'shade') => {
    setSeeds(prev => prev.map(s => s.id === id ? { ...s, text: newText, priority: priority || s.priority } : s));
  };

  const handleMoveSeed = (id: string, status: 'active' | 'backlog') => {
    setSeeds(prev => {
      // Enforce max 5 limit for active bench
      if (status === 'active') {
        const activeCount = prev.filter(s => s.status === 'active' && !s.completed).length;
        if (activeCount >= 5) {
          alert("Your Potting Bench is full! Harvest (complete) or move a plant back to the packet first.");
          return prev;
        }
      }
      return prev.map(s => s.id === id ? { ...s, status } : s);
    });
  };

  const handleToggleSeed = (id: string) => {
    setSeeds(prev => {
      const seed = prev.find(s => s.id === id);
      if (seed && !seed.completed) {
        // Transitioning to completed: archive it and add a background plant
        const archived: ArchivedSeed = {
          id: seed.id,
          text: seed.text,
          priority: seed.priority,
          archivedAt: Date.now(),
          archiveReason: 'completed',
          focusTime: seed.focusTime || 0
        };
        setArchivedSeeds(ap => [archived, ...ap]);
        setPlantSprites(ps => {
          const pos = generatePlantPosition(ps, seed.id);
          return [...ps, { id: `plant-${seed.id}-${Date.now()}`, x: pos.x, y: pos.y }];
        });
        if (selectedTaskId === id) setSelectedTaskId(null);
      }
      return prev.map(s => s.id === id ? { ...s, completed: !s.completed } : s);
    });
  };

  const handleDeleteSeed = (id: string) => {
    setSeeds(prev => {
      const seed = prev.find(s => s.id === id);
      if (seed) {
        const archived: ArchivedSeed = {
          id: seed.id,
          text: seed.text,
          priority: seed.priority,
          archivedAt: Date.now(),
          archiveReason: 'deleted',
          focusTime: seed.focusTime || 0
        };
        setArchivedSeeds(ap => [archived, ...ap]);
        if (selectedTaskId === id) setSelectedTaskId(null);
      }
      return prev.filter(s => s.id !== id);
    });
  };

  const handleClearSeeds = () => {
    if (window.confirm("Are you sure you want to clear your garden patch?")) {
      setSeeds(prev => {
        const toArchive: ArchivedSeed[] = prev.map(s => ({
          id: s.id,
          text: s.text,
          priority: s.priority,
          archivedAt: Date.now(),
          archiveReason: 'deleted' as const,
          focusTime: s.focusTime || 0
        }));
        setArchivedSeeds(ap => [...toArchive, ...ap]);
        return [];
      });
      setSelectedTaskId(null);
    }
  };

  const handleClearArchive = () => {
    setArchivedSeeds([]);
  };

  const handleSelectTask = (id: string | null) => {
    setSelectedTaskId(prev => prev === id ? null : id);
  };

  // --- Notification Logic ---
  const requestNotificationPermission = async () => {
    if (typeof Notification !== 'undefined') {
      try {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
        if (permission === 'granted') {
          sendBrowserNotification("Notifications Enabled!", "You'll now get pop-ups even in other tabs.");
        }
      } catch (e) {
        console.error("Permission request failed", e);
      }
    }
  };

  const sendBrowserNotification = (title: string, body: string) => {
    if (typeof Notification !== 'undefined' && notificationPermission === 'granted') {
      try {
        const tag = `tomato-${Date.now()}`;
        const notification = new Notification(title, {
          body,
          icon: 'https://cdn-icons-png.flaticon.com/512/1202/1202125.png',
          tag: tag,
          requireInteraction: true
        });
        notification.onclick = () => {
          window.focus();
          notification.close();
        };
      } catch (e) {
        console.error("Notification creation failed", e);
      }
    }
  };

  // --- PiP Logic ---
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

          // Copy styles to PiP window
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

          // Add Tailwind CDN if local styles fail
          const script = document.createElement('script');
          script.src = "https://cdn.tailwindcss.com";
          pip.document.head.appendChild(script);

          // Add Font
          const fontLink = document.createElement('link');
          fontLink.href = "https://fonts.googleapis.com/css2?family=Fredoka:wght@300..700&display=swap";
          fontLink.rel = "stylesheet";
          pip.document.head.appendChild(fontLink);

          // Body Style
          pip.document.body.style.fontFamily = "'Fredoka', sans-serif";
          pip.document.body.style.backgroundColor = "#fffbeb";
          pip.document.body.style.display = "flex";
          pip.document.body.style.justifyContent = "center";
          pip.document.body.style.alignItems = "center";

          setPipWindow(pip);

          pip.addEventListener('pagehide', () => {
            setPipWindow(null);
          });
        } catch (err: any) {
          console.error("PiP failed", err);
          if (err.message && (err.message.includes("top-level") || err.name === 'NotAllowedError')) {
            alert("Picture-in-Picture cannot be opened from inside a preview frame. Please open the app in a new tab to use this feature.");
          } else {
            alert("Could not open Picture-in-Picture window.");
          }
        }
      } else {
        alert("Your browser does not support Document Picture-in-Picture API.");
      }
    }
  };

  // --- Schedule Logic ---
  const handleStartGarden = () => {
    // Generate Schedule Logic Locally
    const totalInputMinutes = (inputHours * 60) + inputMinutes;
    const actualMinutes = totalInputMinutes > 0 ? totalInputMinutes : 25;

    const newSessions: Session[] = [];
    let remaining = actualMinutes;
    let count = 0;

    while (remaining > 0) {
      count++;
      // Focus
      const focusDur = Math.min(25, remaining);
      newSessions.push({
        id: Math.random().toString(36).substr(2, 9),
        type: SessionType.FOCUS,
        durationMinutes: focusDur,
        label: `Focus Session ${count}`
      });
      remaining -= focusDur;
      if (remaining <= 0) break;

      // Break
      const isLong = count % 4 === 0;
      const breakDur = Math.min(isLong ? 15 : 5, remaining);
      newSessions.push({
        id: Math.random().toString(36).substr(2, 9),
        type: isLong ? SessionType.LONG_BREAK : SessionType.SHORT_BREAK,
        durationMinutes: breakDur,
        label: isLong ? 'Long Break' : 'Short Break'
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
  };

  const handleStartTimer = () => {
    if (!isRunning) {
      const now = Date.now();
      if (!sessionStartTime) setSessionStartTime(now);
      setTargetEndTime(now + (timeLeft * 1000));
      setIsRunning(true);
      if (ambience !== 'off') audioService.startAmbience(ambience); // Ensure ambience starts
    }
  };

  const handlePauseTimer = () => {
    setIsRunning(false);
    setTargetEndTime(null);
    audioService.stopAmbience(); // Pause ambience when timer pauses
  };

  const handleCompleteEarly = () => {
    setIsRunning(false);
    setTargetEndTime(null);
    setTimeLeft(0);
    triggerCompletion();
  };

  const triggerCompletion = () => {
    const currentSessionObj = schedule?.sessions[currentSessionIndex];
    if (currentSessionObj) {
      const isFocus = currentSessionObj.type === SessionType.FOCUS;
      const title = isFocus ? '🍅 Harvest Time!' : '🥗 Break Over!';
      const body = isFocus
        ? `Great job! Your ${currentSessionObj.label} session is complete.`
        : 'Time to get back to the garden objective!';

      sendBrowserNotification(title, body);
      audioService.playChime();
      audioService.stopAmbience(); // Stop ambience on completion
    }
    setShowNotification(true);
  };

  const handleUpdateLabel = (newLabel?: string, seedId?: string) => {
    if (!schedule) return;
    const newSessions = [...schedule.sessions];
    newSessions[currentSessionIndex].label = newLabel || editingLabelText || 'Untitled Growth';
    if (seedId) newSessions[currentSessionIndex].seedId = seedId;
    setSchedule({ ...schedule, sessions: newSessions });
    setIsEditingLabel(false);
  };

  // Drag and Drop Handler
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const seedId = e.dataTransfer.getData("application/tomato-seed");
    const textData = e.dataTransfer.getData("text/plain");

    if (seedId) {
      const seed = seeds.find(s => s.id === seedId);
      if (seed && schedule) {
        handleUpdateLabel(seed.text, seed.id);
      }
    } else if (textData && schedule) {
      handleUpdateLabel(textData);
    }
  };

  const nextSession = useCallback(() => {
    if (!schedule) return;

    const currentSessionObj = schedule.sessions[currentSessionIndex];
    const endTime = Date.now();
    const startTime = sessionStartTime || (endTime - (currentSessionObj.durationMinutes * 60 * 1000));

    const newHistoryEntry: CompletedSession = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toDateString(),
      label: currentSessionObj.label,
      type: currentSessionObj.type,
      startTime: startTime,
      endTime: endTime,
      durationMinutes: currentSessionObj.durationMinutes
    };

    setHistory(prev => [newHistoryEntry, ...prev]);

    if (currentSessionObj.type === SessionType.FOCUS) {
      setDailyStats(prev => ({
        ...prev,
        focusMinutes: prev.focusMinutes + currentSessionObj.durationMinutes,
        completedSessions: prev.completedSessions + 1
      }));
    }

    if (currentSessionIndex < schedule.sessions.length - 1) {
      const nextIdx = currentSessionIndex + 1;
      setCurrentSessionIndex(nextIdx);
      const nextDuration = schedule.sessions[nextIdx].durationMinutes * 60;
      setTimeLeft(nextDuration);
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
  }, [currentSessionIndex, schedule, sessionStartTime]);

  // Persistent Timer Loop
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
  }, [isRunning, targetEndTime]);

  // Task Focus Time Tracking — increments selected task's focus time every second
  // only when timer is running AND current session is a focus session (not a break)
  useEffect(() => {
    const isFocusSession = schedule?.sessions[currentSessionIndex]?.type === SessionType.FOCUS;
    if (isRunning && isFocusSession && selectedTaskId) {
      taskTimerRef.current = setInterval(() => {
        setSeeds(prev => prev.map(s =>
          s.id === selectedTaskId
            ? { ...s, focusTime: (s.focusTime || 0) + 1 }
            : s
        ));
      }, 1000);
    } else {
      if (taskTimerRef.current) clearInterval(taskTimerRef.current);
    }
    return () => { if (taskTimerRef.current) clearInterval(taskTimerRef.current); };
  }, [isRunning, schedule, currentSessionIndex, selectedTaskId]);

  const currentSession = schedule?.sessions[currentSessionIndex];

  // Helper for dial controls
  const incrementHours = () => setInputHours(prev => Math.min(12, prev + 1));
  const decrementHours = () => setInputHours(prev => Math.max(0, prev - 1));
  const incrementMinutes = () => setInputMinutes(prev => (prev + 5) >= 60 ? 0 : prev + 5);
  const decrementMinutes = () => setInputMinutes(prev => (prev - 5) < 0 ? 55 : prev - 5);

  return (
    <div className="relative min-h-screen bg-yellow-50">
      <PlantBackground sprites={plantSprites} />
    <div className="relative z-10 min-h-screen px-6 py-8 md:px-12 md:py-12 max-w-7xl mx-auto flex flex-col gap-8">
      {/* Permission Modal */}
      {notificationPermission === 'default' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-yellow-50/90 backdrop-blur-xl animate-in zoom-in-95 duration-500">
          <div className="tomato-card p-12 max-w-lg w-full text-center space-y-8 shadow-2xl border-yellow-400">
            <div className="text-8xl floating">🍅</div>
            <div className="space-y-4">
              <h2 className="text-4xl font-black text-stone-800 tracking-tight leading-tight">Enable Garden Alerts?</h2>
              <p className="text-stone-500 font-medium text-lg leading-relaxed">
                To notify you when focus ends (even if you're in another tab), Tomato Time needs your browser's permission to sprout pop-up alerts.
              </p>
            </div>
            <div className="flex flex-col gap-4">
              <button onClick={requestNotificationPermission} className="tomato-button py-6 text-xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all">
                <span>🔔</span> Enable Alerts
              </button>
              <button onClick={() => setNotificationPermission('denied')} className="text-stone-400 font-bold text-sm hover:text-stone-600 transition-colors">
                Continue without Alerts
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="text-5xl drop-shadow-sm floating select-none">🍅</div>
          <div>
            <h1 className="text-3xl font-black text-red-600 tracking-tight">Tomato Time</h1>
            <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">Your Focus Garden</p>
          </div>
        </div>
        <div className="flex gap-4 items-center">
          <div className="flex items-center bg-white p-1 rounded-full border-2 border-stone-100 shadow-sm">
            <button onClick={requestNotificationPermission} className={`p-2 rounded-full transition-all ${notificationPermission === 'granted' ? 'text-green-500 bg-green-50' : 'text-stone-300 hover:text-yellow-500'}`} title="Toggle Notifications">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
            <button onClick={() => setShowHistory(true)} className="p-2 rounded-full text-stone-300 hover:text-red-500 transition-all" title="Garden Journal">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </button>
            <button onClick={() => setShowAbout(true)} className="p-2 rounded-full text-stone-300 hover:text-green-500 transition-all" title="How to grow">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
          <div className="hidden sm:flex bg-white px-6 py-3 rounded-full border-2 border-stone-100 items-center gap-3 shadow-sm">
            <div className="text-2xl">🔥</div>
            <div>
              <p className="text-xl font-black leading-none">{dailyStats.completedSessions}</p>
              <p className="text-[10px] font-bold text-stone-400 uppercase">Harvested</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">

        {/* Left Column: Active App or Setup */}
        <main className="flex-1 w-full flex flex-col items-center">
          {!schedule ? (
            <div className="w-full max-w-2xl flex flex-col items-center justify-center space-y-10 py-10 animate-in zoom-in-95 duration-500">
              <div className="text-center space-y-4">
                <h2 className="text-4xl md:text-5xl font-black text-stone-800 leading-tight">Time to Grow?</h2>
                <p className="text-stone-500 text-lg font-medium">Set your total focus time. We'll handle the breaks.</p>
              </div>

              {/* Time Dial UI */}
              <div className="flex items-center gap-4 md:gap-8 p-8 bg-white rounded-[3rem] shadow-xl border-4 border-red-50">
                <div className="flex flex-col items-center gap-2">
                  <button onClick={incrementHours} className="p-2 text-stone-300 hover:text-red-500 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
                  </button>
                  <div className="w-24 h-24 md:w-32 md:h-32 bg-stone-50 rounded-2xl flex items-center justify-center border-4 border-stone-100">
                    <span className="text-5xl md:text-6xl font-black text-stone-800">{inputHours}</span>
                  </div>
                  <button onClick={decrementHours} className="p-2 text-stone-300 hover:text-red-500 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                  </button>
                  <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">Hours</span>
                </div>

                <div className="text-4xl font-black text-stone-200 -mt-8">:</div>

                <div className="flex flex-col items-center gap-2">
                  <button onClick={incrementMinutes} className="p-2 text-stone-300 hover:text-red-500 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
                  </button>
                  <div className="w-24 h-24 md:w-32 md:h-32 bg-stone-50 rounded-2xl flex items-center justify-center border-4 border-stone-100">
                    <span className="text-5xl md:text-6xl font-black text-stone-800">{inputMinutes.toString().padStart(2, '0')}</span>
                  </div>
                  <button onClick={decrementMinutes} className="p-2 text-stone-300 hover:text-red-500 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                  </button>
                  <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">Mins</span>
                </div>
              </div>

              <button
                onClick={handleStartGarden}
                className="tomato-button px-12 py-5 text-2xl font-black tracking-widest uppercase hover:scale-105 active:scale-95 transition-all shadow-xl shadow-red-200"
              >
                Plant Garden
              </button>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center justify-center bg-white rounded-[3rem] p-8 shadow-sm border-2 border-stone-50 relative animate-in fade-in slide-in-from-bottom-5 duration-500">
              {/* Session Label Editor & Drop Zone */}
              <div
                className="absolute top-10 left-10 right-10 flex flex-col items-center gap-1 group"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
              >
                {isEditingLabel ? (
                  <div className="flex items-center gap-2 animate-in slide-in-from-top-2">
                    <input
                      autoFocus
                      className="bg-stone-50 border-2 border-red-100 rounded-xl px-4 py-2 text-center font-black text-red-600 outline-none focus:border-red-400"
                      value={editingLabelText}
                      onChange={(e) => setEditingLabelText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleUpdateLabel()}
                      onBlur={() => handleUpdateLabel()}
                    />
                    <button onClick={() => handleUpdateLabel()} className="bg-green-500 text-white p-2 rounded-xl">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => { setEditingLabelText(currentSession?.label || ''); setIsEditingLabel(true); }}
                    className="cursor-pointer group flex flex-col items-center p-4 rounded-2xl transition-all border-2 border-transparent hover:bg-stone-50 hover:border-stone-100 border-dashed hover:border-red-200"
                    title="Click to edit or drop a task here"
                  >
                    <p className="text-stone-300 font-black uppercase text-[10px] tracking-[0.3em] group-hover:text-red-300 transition-colors">Objective</p>
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-black text-stone-800 tracking-tight">{currentSession?.label}</h2>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-stone-200 group-hover:text-stone-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </div>
                  </div>
                )}
              </div>

              {/* Main Content: Render in PiP or Normal */}
              {pipWindow && (
                createPortal(
                  <div className="h-full w-full flex flex-col items-center justify-center p-4">
                    <TimerDisplay
                      seconds={timeLeft}
                      totalSeconds={currentSession?.durationMinutes ? currentSession.durationMinutes * 60 : 1}
                      label={currentSession?.type || 'SESSION'}
                      isFocus={currentSession?.type === SessionType.FOCUS}
                    />
                    <button
                      onClick={togglePiP}
                      className="mt-4 text-xs font-bold text-red-400 uppercase tracking-widest hover:text-red-600"
                    >
                      Restore Window
                    </button>
                  </div>,
                  pipWindow.document.body
                )
              )}

              {/* Only show timer here if PiP is NOT active */}
              {!pipWindow && (
                <TimerDisplay
                  seconds={timeLeft}
                  totalSeconds={currentSession?.durationMinutes ? currentSession.durationMinutes * 60 : 1}
                  label={currentSession?.type || 'SESSION'}
                  isFocus={currentSession?.type === SessionType.FOCUS}
                />
              )}

              <div className="flex flex-col items-center gap-6 mt-4">

                {/* Ambience Controls */}
                <div className="flex items-center gap-2 bg-stone-50 p-1 rounded-full border border-stone-200">
                  <button
                    onClick={() => setAmbience('off')}
                    className={`p-2 rounded-full transition-all ${ambience === 'off' ? 'bg-white shadow text-stone-600' : 'text-stone-400 hover:text-stone-600'}`}
                    title="Silence"
                  >
                    🔇
                  </button>
                  <button
                    onClick={() => setAmbience('rain')}
                    className={`p-2 rounded-full transition-all ${ambience === 'rain' ? 'bg-blue-100 shadow text-blue-600' : 'text-stone-400 hover:text-blue-500'}`}
                    title="Rain Ambience"
                  >
                    🌧️
                  </button>
                  <button
                    onClick={() => setAmbience('wind')}
                    className={`p-2 rounded-full transition-all ${ambience === 'wind' ? 'bg-green-100 shadow text-green-600' : 'text-stone-400 hover:text-green-500'}`}
                    title="Garden Breeze"
                  >
                    🍃
                  </button>
                </div>

                <div className="flex items-center gap-8">
                  {!isRunning ? (
                    <button onClick={handleStartTimer} className="tomato-button h-24 w-24 flex items-center justify-center hover:scale-110 shadow-[0_6px_0_0_#b91c1c] active:translate-y-1 active:shadow-none transition-all">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 fill-current translate-x-1" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                    </button>
                  ) : (
                    <button onClick={handlePauseTimer} className="tomato-button-secondary h-24 w-24 flex items-center justify-center hover:scale-110 shadow-[0_6px_0_0_#15803d] active:translate-y-1 active:shadow-none transition-all">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 fill-current" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                    </button>
                  )}

                  <div className="flex flex-col gap-2">
                    <button onClick={handleCompleteEarly} className="bg-yellow-400 text-white h-12 w-12 rounded-full flex items-center justify-center hover:scale-110 shadow-[0_3px_0_0_#ca8a04] active:translate-y-1 active:shadow-none transition-all" title="Finish session early">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </button>
                    {/* PiP Button */}
                    <button
                      onClick={togglePiP}
                      className={`bg-stone-200 text-stone-500 h-12 w-12 rounded-full flex items-center justify-center hover:scale-110 shadow-[0_3px_0_0_#d6d3d1] active:translate-y-1 active:shadow-none transition-all ${pipWindow ? 'ring-2 ring-red-400' : ''}`}
                      title="Pop Out Window"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSchedule(null);
                    setIsRunning(false);
                    setTargetEndTime(null);
                    localStorage.removeItem('tomato_active_schedule');
                  }}
                  className="text-stone-300 font-bold hover:text-red-400 transition-colors uppercase text-[10px] tracking-[0.3em]"
                >
                  Reset Garden
                </button>
              </div>
            </div>
          )}
        </main>

        {/* Right Column: Pervasive Sidebar (Checklist + Stats) */}
        <aside className="w-full lg:w-[380px] space-y-6 flex flex-col">
          {/* Pervasive Checklist */}
          <SeedChecklist
            seeds={seeds}
            onAdd={handleAddSeed}
            onEdit={handleEditSeed}
            onToggle={handleToggleSeed}
            onDelete={handleDeleteSeed}
            onMove={handleMoveSeed}
            onClear={handleClearSeeds}
            archivedCount={archivedSeeds.length}
            onViewArchive={() => setShowArchive(true)}
            selectedTaskId={selectedTaskId}
            onSelectTask={handleSelectTask}
          />

          {/* Conditional Stats/Basket - only show when active */}
          {schedule && (
            <div className="space-y-6 animate-in slide-in-from-right-5 duration-500">
              <div className="tomato-card p-6 border-stone-50">
                <h3 className="text-lg font-black text-stone-800 mb-6 flex items-center gap-2">
                  <span>🧺</span> Session Basket
                </h3>
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {schedule.sessions.map((session, idx) => (
                    <div
                      key={session.id}
                      className={`p-4 rounded-3xl flex items-center justify-between transition-all duration-300 ${idx === currentSessionIndex
                        ? 'bg-yellow-50 border-2 border-yellow-200 scale-105 shadow-sm'
                        : idx < currentSessionIndex ? 'bg-stone-50 opacity-50 grayscale' : 'bg-white border border-stone-100 opacity-80'
                        }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-2xl">{session.type === SessionType.FOCUS ? '🍅' : '🍃'}</div>
                        <div>
                          <h4 className={`font-bold text-sm ${idx === currentSessionIndex ? 'text-stone-800' : 'text-stone-500'}`}>
                            {session.label}
                          </h4>
                          <p className="text-[10px] text-stone-400 font-bold uppercase">{session.durationMinutes} min</p>
                        </div>
                      </div>
                      {idx < currentSessionIndex && (
                        <div className="text-green-500 text-lg">✅</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="tomato-card p-6 bg-green-50/50 border-green-100 shadow-[0_10px_0_0_#dcfce7]">
                <h3 className="text-lg font-black text-green-800 mb-4 flex items-center gap-2">
                  <span>📊</span> Today's Yield
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-green-700">
                    <span>Focus Progress:</span>
                    <span>{dailyStats.focusMinutes} m</span>
                  </div>
                  <div className="h-3 bg-white/50 rounded-full border border-green-200 overflow-hidden">
                    <div
                      className="h-full bg-green-500 transition-all duration-1000"
                      style={{ width: `${Math.min((dailyStats.focusMinutes / 120) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>

      {showNotification && currentSession && (
        <NotificationOverlay
          type={currentSession.type}
          seedId={currentSession.seedId}
          onClose={() => setShowNotification(false)}
          onNext={nextSession}
          onHarvest={currentSession.seedId ? () => handleToggleSeed(currentSession.seedId!) : undefined}
        />
      )}

      {showHistory && (
        <HistoryHub history={history} archivedSeeds={archivedSeeds} onClose={() => setShowHistory(false)} />
      )}

      {showAbout && (
        <AboutModal onClose={() => setShowAbout(false)} />
      )}

      {showArchive && (
        <ArchivedSeedsModal
          archivedSeeds={archivedSeeds}
          onClose={() => setShowArchive(false)}
          onClearAll={handleClearArchive}
        />
      )}

      <footer className="mt-auto py-6 text-center">
        <p className="text-xs font-bold text-stone-300 uppercase tracking-[0.2em]">
          Cultivated with care &bull; Tomato Time v3.1
        </p>
      </footer>
    </div>
    </div>
  );
};

export default App;
