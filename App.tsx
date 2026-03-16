
import React, { useState } from 'react';
import { runMigration } from './services/migrationService';
import { useAuth } from './hooks/useAuth';
import { useBeasts } from './hooks/useBeasts';
import { useHuntingGrounds } from './hooks/useHuntingGrounds';
import { useTimer } from './hooks/useTimer';
import { useDailyStats } from './hooks/useDailyStats';
import { useSupabaseSync } from './hooks/useSupabaseSync';
import { Header } from './components/layout/Header';
import { MobileTimerBar } from './components/layout/MobileTimerBar';
import { SessionType } from './types';
import { TimerArea } from './components/timer/TimerArea';
import { HuntRoster } from './components/timer/HuntRoster';
import { NotificationOverlay } from './components/timer/NotificationOverlay';
import { TaskSidebar } from './components/tasks/TaskSidebar';
import { HuntJournal } from './components/modals/HuntJournal';
import { BloodEchoesModal } from './components/modals/BloodEchoesModal';
import { AboutModal } from './components/AboutModal';
import { AuthGate } from './components/AuthGate';

// Run migration once on load
runMigration();

const App: React.FC = () => {
  const auth = useAuth();
  const beasts = useBeasts();
  const grounds = useHuntingGrounds();
  const stats = useDailyStats();

  const timer = useTimer({
    selectedBeast: beasts.selectedBeast,
    onFocusTick: beasts.addHuntSecond,
    onSessionComplete: stats.recordSession,
  });

  // Supabase sync
  useSupabaseSync({
    userId: auth.user?.id ?? null,
    state: {
      beasts: beasts.beasts,
      slainBeasts: beasts.slainBeasts,
      huntingGrounds: grounds.grounds,
      dailyStats: stats.dailyStats,
      history: stats.history,
    },
    onRemoteData: (data) => {
      beasts.loadRemote(data.beasts, data.slainBeasts);
      grounds.loadRemote(data.huntingGrounds);
      stats.loadRemote(data.dailyStats, data.history);
    },
  });

  // Modal state
  const [showHistory, setShowHistory] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showArchive, setShowArchive] = useState(false);

  // Loading state
  if (auth.authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0f1a]">
        <div className="text-center space-y-4">
          <div className="text-6xl pulse-glow">⚔️</div>
          <p className="text-sm font-bold text-zinc-600 uppercase tracking-widest">Preparing the hunt...</p>
        </div>
      </div>
    );
  }

  // Auth gate
  if (!auth.user && !auth.skipAuth) {
    return <AuthGate onContinueLocal={auth.continueLocal} />;
  }

  // Notification permission modal
  if (timer.notificationPermission === 'default') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0f1a]">
        <div className="hunt-card p-12 max-w-lg w-full text-center space-y-8 shadow-2xl">
          <div className="text-8xl pulse-glow">⚔️</div>
          <div className="space-y-4">
            <h2 className="text-4xl font-black text-zinc-100 tracking-tight leading-tight font-gothic">Enable Hunt Alerts?</h2>
            <p className="text-zinc-500 font-medium text-lg leading-relaxed">
              To notify you when hunts end — even in other tabs — we need your browser's permission.
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <button onClick={timer.requestNotificationPermission} className="hunt-button py-6 text-xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all">
              <span>🔔</span> Enable Alerts
            </button>
            <button onClick={() => timer.setNotificationPermission('denied')} className="text-zinc-500 font-bold text-sm hover:text-zinc-300 transition-colors">
              Hunt without alerts
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#0f0f1a]">
      {/* Subtle fog background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-red-900/5 via-transparent to-purple-900/5 fog-drift" />
      </div>

      <div className="relative z-10 min-h-screen px-6 py-8 md:px-12 md:py-12 max-w-7xl mx-auto flex flex-col gap-8">
        {/* Header */}
        <Header
          dailyStats={stats.dailyStats}
          user={auth.user}
          skipAuth={auth.skipAuth}
          notificationPermission={timer.notificationPermission}
          onRequestNotifications={timer.requestNotificationPermission}
          onShowHistory={() => setShowHistory(true)}
          onShowAbout={() => setShowAbout(true)}
          onSignOut={auth.signOut}
          onSignIn={auth.signIn}
        />

        {/* Mobile Timer Bar */}
        {timer.schedule && timer.currentSession && (
          <MobileTimerBar
            timeLeft={timer.timeLeft}
            isRunning={timer.isRunning}
            isFocus={timer.currentSession.type === SessionType.FOCUS}
            sessionLabel={timer.currentSession.label}
            onStart={timer.startTimer}
            onPause={timer.pauseTimer}
          />
        )}

        {/* Main Layout */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Left: Timer */}
          <main className="flex-1 w-full flex flex-col items-center">
            <TimerArea
              inputHours={timer.inputHours}
              inputMinutes={timer.inputMinutes}
              onIncrementHours={timer.incrementHours}
              onDecrementHours={timer.decrementHours}
              onIncrementMinutes={timer.incrementMinutes}
              onDecrementMinutes={timer.decrementMinutes}
              onBeginHunt={timer.beginHunt}
              schedule={timer.schedule}
              currentSession={timer.currentSession}
              timeLeft={timer.timeLeft}
              isRunning={timer.isRunning}
              isEditingLabel={timer.isEditingLabel}
              editingLabelText={timer.editingLabelText}
              ambience={timer.ambience}
              pipWindow={timer.pipWindow}
              onStart={timer.startTimer}
              onPause={timer.pauseTimer}
              onCompleteEarly={timer.completeEarly}
              onTogglePiP={timer.togglePiP}
              onSetAmbience={timer.setAmbience}
              onReset={timer.resetHunt}
              onSetEditingLabel={timer.setIsEditingLabel}
              onSetEditingLabelText={timer.setEditingLabelText}
              onUpdateLabel={timer.updateLabel}
              beasts={beasts.beasts}
            />
          </main>

          {/* Right: Task Sidebar */}
          <aside className="w-full lg:w-[380px] space-y-6 flex flex-col">
            <TaskSidebar
              beasts={beasts.beasts}
              grounds={grounds.grounds}
              selectedBeastId={beasts.selectedBeastId}
              archivedCount={beasts.slainBeasts.length}
              onAddBeasts={beasts.addBeasts}
              onEditBeast={beasts.editBeast}
              onSelectBeast={beasts.selectBeast}
              onActivateBeast={beasts.activateBeast}
              onDeactivateBeast={beasts.deactivateBeast}
              onSlayBeast={beasts.slayBeast}
              onClaimEchoes={beasts.claimEchoes}
              onAwaitInsight={beasts.awaitInsight}
              onResumeHunt={beasts.resumeHunt}
              onAbandonBeast={beasts.abandonBeast}
              onClearAll={beasts.clearAll}
              onAddGround={grounds.addGround}
              onDeleteGround={grounds.deleteGround}
              onViewArchive={() => setShowArchive(true)}
            />

            {/* Hunt Roster + Tonight's Hunt stats */}
            {timer.schedule && (
              <div className="space-y-6 animate-in slide-in-from-right-5 duration-500">
                <HuntRoster
                  sessions={timer.schedule.sessions}
                  currentIndex={timer.currentSessionIndex}
                />

                <div className="hunt-card p-6 bg-red-900/10">
                  <h3 className="text-lg font-bold text-zinc-200 mb-4 flex items-center gap-2 font-gothic">
                    <span>📊</span> Tonight's Hunt
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-zinc-400">
                      <span>Hunt Progress:</span>
                      <span>{stats.dailyStats.focusMinutes} m</span>
                    </div>
                    <div className="h-3 bg-zinc-900 rounded-full border border-zinc-700 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-red-800 to-red-600 transition-all duration-1000"
                        style={{ width: `${Math.min((stats.dailyStats.focusMinutes / 120) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </aside>
        </div>

        {/* Modals */}
        {timer.showNotification && timer.currentSession && (
          <NotificationOverlay
            type={timer.currentSession.type}
            onClose={() => timer.setShowNotification(false)}
            onNext={timer.nextSession}
          />
        )}

        {showHistory && (
          <HuntJournal
            history={stats.history}
            slainBeasts={beasts.slainBeasts}
            onClose={() => setShowHistory(false)}
          />
        )}

        {showAbout && (
          <AboutModal onClose={() => setShowAbout(false)} />
        )}

        {showArchive && (
          <BloodEchoesModal
            slainBeasts={beasts.slainBeasts}
            grounds={grounds.grounds}
            onClose={() => setShowArchive(false)}
            onClearAll={beasts.clearArchive}
          />
        )}

        <footer className="mt-auto py-6 text-center">
          <p className="text-xs font-bold text-zinc-700 uppercase tracking-[0.2em]">
            Forged in blood &bull; HuntingTime v4.0
          </p>
        </footer>
      </div>
    </div>
  );
};

export default App;
