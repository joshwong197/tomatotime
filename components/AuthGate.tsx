import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';

interface AuthGateProps {
  onContinueLocal: () => void;
}

export const AuthGate: React.FC<AuthGateProps> = ({ onContinueLocal }) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationSent, setConfirmationSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setConfirmationSent(true);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (confirmationSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0f1a] p-4">
        <div className="hunt-card p-8 max-w-md w-full text-center space-y-4">
          <div className="text-5xl">📬</div>
          <h2 className="text-2xl font-black text-zinc-100 font-gothic">Check Your Messenger</h2>
          <p className="text-sm font-bold text-zinc-500">
            A message has been sent to <span className="text-zinc-200">{email}</span>.
            Follow the link to join the hunt.
          </p>
          <button
            onClick={() => { setConfirmationSent(false); setMode('signin'); }}
            className="hunt-button-secondary py-3 px-6 font-black uppercase tracking-widest text-sm"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f0f1a] p-4">
      <div className="hunt-card p-8 max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="text-5xl pulse-glow">⚔️</div>
          <h1 className="text-3xl font-black text-zinc-100 font-gothic">HuntingTime</h1>
          <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest">
            {mode === 'signin' ? 'Welcome back, hunter' : 'Join the hunt'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="hunt-input w-full px-4 py-3 text-sm font-bold placeholder:text-zinc-600"
              placeholder="hunter@yharnam.net"
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="hunt-input w-full px-4 py-3 text-sm font-bold placeholder:text-zinc-600"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-800/50 rounded-xl p-3 text-xs font-bold text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full hunt-button py-4 font-black uppercase tracking-widest text-sm disabled:opacity-50"
          >
            {loading ? 'Preparing...' : mode === 'signin' ? 'Enter the Hunt' : 'Register Hunter'}
          </button>
        </form>

        <div className="text-center space-y-3">
          <button
            onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null); }}
            className="text-xs font-bold text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            {mode === 'signin' ? "New hunter? Create an account" : 'Already hunting? Sign in'}
          </button>

          <div className="border-t border-zinc-800 pt-3">
            <button
              onClick={onContinueLocal}
              className="text-[10px] font-bold text-zinc-600 hover:text-zinc-400 uppercase tracking-widest transition-colors"
            >
              Hunt without an account (local only)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
