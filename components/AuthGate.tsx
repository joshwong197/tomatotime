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
        // Auth state change will be picked up by the listener in App.tsx
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (confirmationSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fefce8] p-4">
        <div className="tomato-card p-8 max-w-md w-full text-center space-y-4">
          <div className="text-5xl">📬</div>
          <h2 className="text-2xl font-black text-stone-800">Check Your Garden Mail!</h2>
          <p className="text-sm font-bold text-stone-500">
            We've sent a confirmation link to <span className="text-stone-800">{email}</span>.
            Click the link to activate your garden account.
          </p>
          <button
            onClick={() => { setConfirmationSent(false); setMode('signin'); }}
            className="tomato-button-secondary py-3 px-6 font-black uppercase tracking-widest text-sm"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fefce8] p-4">
      <div className="tomato-card p-8 max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="text-5xl">🍅</div>
          <h1 className="text-3xl font-black text-stone-800">Tomato Time</h1>
          <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">
            {mode === 'signin' ? 'Welcome back, gardener' : 'Start your garden'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest block mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-sm font-bold text-stone-700 placeholder:text-stone-300 outline-none focus:border-green-400 transition-colors"
              placeholder="gardener@example.com"
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest block mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-sm font-bold text-stone-700 placeholder:text-stone-300 outline-none focus:border-green-400 transition-colors"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs font-bold text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full tomato-button py-4 font-black uppercase tracking-widest text-sm disabled:opacity-50"
          >
            {loading ? 'Planting...' : mode === 'signin' ? 'Enter Garden' : 'Plant Account'}
          </button>
        </form>

        <div className="text-center space-y-3">
          <button
            onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null); }}
            className="text-xs font-bold text-stone-400 hover:text-stone-600 transition-colors"
          >
            {mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>

          <div className="border-t border-stone-100 pt-3">
            <button
              onClick={onContinueLocal}
              className="text-[10px] font-bold text-stone-300 hover:text-stone-500 uppercase tracking-widest transition-colors"
            >
              Continue without account (local only)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
