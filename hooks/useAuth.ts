import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import type { User } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [skipAuth, setSkipAuth] = useState(() => localStorage.getItem('tomato_skip_auth') === 'true');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const continueLocal = () => {
    setSkipAuth(true);
    localStorage.setItem('tomato_skip_auth', 'true');
  };

  const signIn = () => {
    setSkipAuth(false);
    localStorage.removeItem('tomato_skip_auth');
  };

  return {
    user,
    authLoading,
    skipAuth,
    signOut,
    continueLocal,
    signIn,
  };
}
