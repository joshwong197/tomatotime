import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import { Seed, ArchivedSeed, GardenBed, PlantSprite, DailyStats, CompletedSession } from '../types';

interface SyncableState {
  seeds: Seed[];
  archivedSeeds: ArchivedSeed[];
  gardenBeds: GardenBed[];
  plantSprites: PlantSprite[];
  dailyStats: DailyStats;
  history: CompletedSession[];
}

interface UseSupabaseSyncOptions {
  userId: string | null;
  state: SyncableState;
  onRemoteData: (data: SyncableState) => void;
}

/**
 * Syncs app state to Supabase when a user is logged in.
 * - On login: pulls remote data and merges with local (remote wins for conflicts).
 * - On state changes: debounced upsert to Supabase.
 * - localStorage continues to work as the offline/immediate cache.
 */
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
          // No row exists yet — first sync, push local data up
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
          // Remote data exists — use it (remote wins)
          onRemoteData({
            seeds: data.seeds || [],
            archivedSeeds: data.archived_seeds || [],
            gardenBeds: data.garden_beds || [],
            plantSprites: data.plant_sprites || [],
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
  }, [userId]); // Only run on login/logout

  // Debounced push on state changes
  useEffect(() => {
    if (!userId || !hasPulled.current) return;

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      pushToRemote(userId, state);
    }, 2000); // 2s debounce

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [userId, state.seeds, state.archivedSeeds, state.gardenBeds, state.plantSprites, state.dailyStats, state.history]);

  return { isSyncing: isSyncing.current };
}

async function pushToRemote(userId: string, state: SyncableState) {
  try {
    const { error } = await supabase
      .from('user_data')
      .upsert({
        user_id: userId,
        seeds: state.seeds,
        archived_seeds: state.archivedSeeds,
        garden_beds: state.gardenBeds,
        plant_sprites: state.plantSprites,
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
