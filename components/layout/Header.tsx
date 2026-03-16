import React from 'react';
import type { User } from '@supabase/supabase-js';
import { DailyStats } from '../../types';

interface HeaderProps {
  dailyStats: DailyStats;
  user: User | null;
  skipAuth: boolean;
  notificationPermission: NotificationPermission;
  onRequestNotifications: () => void;
  onShowHistory: () => void;
  onShowAbout: () => void;
  onSignOut: () => void;
  onSignIn: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  dailyStats, user, skipAuth,
  notificationPermission, onRequestNotifications,
  onShowHistory, onShowAbout,
  onSignOut, onSignIn,
}) => {
  return (
    <header className="flex flex-col md:flex-row justify-between items-center gap-6">
      <div className="flex items-center gap-4">
        <div className="text-5xl drop-shadow-sm pulse-glow select-none">⚔️</div>
        <div>
          <h1 className="text-3xl font-black text-red-500 tracking-tight font-gothic">HuntingTime</h1>
          <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest">A Hunter's Focus Tool</p>
        </div>
      </div>
      <div className="flex gap-4 items-center">
        <div className="flex items-center bg-zinc-900/50 p-1 rounded-full border border-zinc-700/30">
          <button
            onClick={onRequestNotifications}
            className={`p-2 rounded-full transition-all ${notificationPermission === 'granted' ? 'text-emerald-400 bg-emerald-900/30' : 'text-zinc-500 hover:text-amber-400'}`}
            title="Toggle Notifications"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
          <button onClick={onShowHistory} className="p-2 rounded-full text-zinc-500 hover:text-red-400 transition-all" title="Hunt Journal">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </button>
          <button onClick={onShowAbout} className="p-2 rounded-full text-zinc-500 hover:text-purple-400 transition-all" title="Hunter's Guide">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>
        <div className="hidden sm:flex bg-zinc-900/50 px-6 py-3 rounded-full border border-zinc-700/30 items-center gap-3">
          <div className="text-2xl">☠️</div>
          <div>
            <p className="text-xl font-black text-zinc-200 leading-none">{dailyStats.completedSessions}</p>
            <p className="text-[10px] font-bold text-zinc-600 uppercase">Slain</p>
          </div>
        </div>
        {/* Auth */}
        {user ? (
          <div className="flex items-center gap-2">
            <div className="bg-zinc-900/50 border border-zinc-700/30 px-3 py-2 rounded-full flex items-center gap-2">
              <span className="text-xs">☁️</span>
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider hidden sm:inline">{user.email?.split('@')[0]}</span>
            </div>
            <button
              onClick={onSignOut}
              className="p-2 rounded-full text-zinc-500 hover:text-red-400 transition-all"
              title="Sign out"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        ) : skipAuth ? (
          <button
            onClick={onSignIn}
            className="text-[10px] font-bold text-zinc-600 hover:text-emerald-400 uppercase tracking-widest transition-colors"
            title="Sign in to sync across devices"
          >
            ☁️ Sign in
          </button>
        ) : null}
      </div>
    </header>
  );
};
