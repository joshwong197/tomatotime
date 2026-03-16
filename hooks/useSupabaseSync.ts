import { useEffect, useRef } from 'react';
import { supabase } from '../services/supabaseClient';
import { Beast, SlainBeast, HuntingGround, DailyStats, CompletedSession } from '../types';

interface SyncableState {
  beasts: Beast[];
  slainBeasts: SlainBeast[];
  huntingGrounds: HuntingGround[];
  dailyStats: DailyStats;
  history: CompletedSession[];
}

interface UseSupabaseSyncOptions {
  userId: string | null;
  state: SyncableState;
  onRemoteData: (data: SyncableState) => void;
}

export function useSupabaseSync({ userId, state, onRemoteData }: UseSupabaseSyncOptions) {
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasPulled = useRef(false);
  const isSyncing = useRef(false);

  // Pull remote data on login
  useEffect(() => {
    if (!userId) {
      hasPulled.current = false;
      return;
    }

    const pullRemote = async () => {
      try {
        const { data, error } = await supabase
          .from('user_data')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (error && error.code === 'PGRST116') {
          await pushToRemote(userId, state);
          hasPulled.current = true;
          return;
        }

        if (error) {
          console.error('Supabase pull error:', error);
          hasPulled.current = true;
          return;
        }

        if (data) {
          onRemoteData({
            beasts: data.seeds || [],
            slainBeasts: data.archived_seeds || [],
            huntingGrounds: data.garden_beds || [],
            dailyStats: data.daily_stats || state.dailyStats,
            history: data.history || [],
          });
        }

        hasPulled.current = true;
      } catch (err) {
        console.error('Supabase pull failed:', err);
        hasPulled.current = true;
      }
    };

    pullRemote();
  }, [userId]);

  // Debounced push on state changes
  useEffect(() => {
    if (!userId || !hasPulled.current) return;

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      pushToRemote(userId, state);
    }, 2000);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [userId, state.beasts, state.slainBeasts, state.huntingGrounds, state.dailyStats, state.history]);

  return { isSyncing: isSyncing.current };
}

async function pushToRemote(userId: string, state: SyncableState) {
  try {
    const { error } = await supabase
      .from('user_data')
      .upsert({
        user_id: userId,
        seeds: state.beasts,
        archived_seeds: state.slainBeasts,
        garden_beds: state.huntingGrounds,
        plant_sprites: [],
        daily_stats: state.dailyStats,
        history: state.history,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (error) {
      console.error('Supabase push error:', error);
    }
  } catch (err) {
    console.error('Supabase push failed:', err);
  }
}
