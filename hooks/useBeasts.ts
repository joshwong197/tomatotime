import { useState, useCallback } from 'react';
import { useLocalStorage, useLocalStorageString } from './useLocalStorage';
import { Beast, SlainBeast, ThreatLevel } from '../types';

export function useBeasts() {
  const [beasts, setBeasts] = useLocalStorage<Beast[]>('tomato_seeds', []);
  const [slainBeasts, setSlainBeasts] = useLocalStorage<SlainBeast[]>('tomato_archived_seeds', []);
  const [selectedBeastId, setSelectedBeastId] = useLocalStorageString('tomato_selected_task');

  const selectedBeast = beasts.find(b => b.id === selectedBeastId) ?? null;

  const addBeasts = useCallback((texts: string[], threat: ThreatLevel = 'boss', groundsId?: string) => {
    const newBeasts: Beast[] = texts.map(text => ({
      id: Math.random().toString(36).substr(2, 9),
      text,
      status: 'backlog' as const,
      threat,
      createdAt: Date.now(),
      huntTime: 0,
      ...(groundsId ? { groundsId } : {}),
    }));
    setBeasts(prev => [...newBeasts, ...prev]);
  }, [setBeasts]);

  const editBeast = useCallback((id: string, text: string, threat?: ThreatLevel) => {
    setBeasts(prev => prev.map(b =>
      b.id === id ? { ...b, text, threat: threat || b.threat } : b
    ));
  }, [setBeasts]);

  // backlog → active (max 5)
  const activateBeast = useCallback((id: string) => {
    setBeasts(prev => {
      const activeCount = prev.filter(b => b.status === 'active').length;
      if (activeCount >= 5) {
        alert("Your Hunter's Workshop is full! Slay or shelve a beast first.");
        return prev;
      }
      return prev.map(b => b.id === id ? { ...b, status: 'active' as const } : b);
    });
  }, [setBeasts]);

  // active → backlog
  const deactivateBeast = useCallback((id: string) => {
    setBeasts(prev => prev.map(b =>
      b.id === id ? { ...b, status: 'backlog' as const } : b
    ));
  }, [setBeasts]);

  // active → done (stays visible with strikethrough)
  const slayBeast = useCallback((id: string) => {
    setBeasts(prev => prev.map(b =>
      b.id === id ? { ...b, status: 'done' as const, slainAt: Date.now() } : b
    ));
    if (selectedBeastId === id) setSelectedBeastId(null);
  }, [setBeasts, selectedBeastId, setSelectedBeastId]);

  // done → archived (claim blood echoes)
  const claimEchoes = useCallback((id: string) => {
    setBeasts(prev => {
      const beast = prev.find(b => b.id === id);
      if (beast) {
        const slain: SlainBeast = {
          id: beast.id,
          text: beast.text,
          threat: beast.threat,
          archivedAt: Date.now(),
          fate: 'slain',
          huntTime: beast.huntTime,
          groundsId: beast.groundsId,
        };
        setSlainBeasts(ap => [slain, ...ap]);
      }
      return prev.filter(b => b.id !== id);
    });
    if (selectedBeastId === id) setSelectedBeastId(null);
  }, [setBeasts, setSlainBeasts, selectedBeastId, setSelectedBeastId]);

  // active → on_hold
  const awaitInsight = useCallback((id: string, insightNote?: string) => {
    setBeasts(prev => prev.map(b =>
      b.id === id ? { ...b, status: 'on_hold' as const, insightNote } : b
    ));
    if (selectedBeastId === id) setSelectedBeastId(null);
  }, [setBeasts, selectedBeastId, setSelectedBeastId]);

  // on_hold → active (resume)
  const resumeHunt = useCallback((id: string) => {
    setBeasts(prev => {
      const activeCount = prev.filter(b => b.status === 'active').length;
      if (activeCount >= 5) {
        alert("Your Hunter's Workshop is full! Slay or shelve a beast first.");
        return prev;
      }
      return prev.map(b =>
        b.id === id ? { ...b, status: 'active' as const, insightNote: undefined } : b
      );
    });
  }, [setBeasts]);

  // done → active (revive)
  const reviveBeast = useCallback((id: string) => {
    setBeasts(prev => prev.map(b =>
      b.id === id ? { ...b, status: 'active' as const, slainAt: undefined } : b
    ));
  }, [setBeasts]);

  // any → archived (abandon)
  const abandonBeast = useCallback((id: string) => {
    setBeasts(prev => {
      const beast = prev.find(b => b.id === id);
      if (beast) {
        const slain: SlainBeast = {
          id: beast.id,
          text: beast.text,
          threat: beast.threat,
          archivedAt: Date.now(),
          fate: 'abandoned',
          huntTime: beast.huntTime,
          groundsId: beast.groundsId,
        };
        setSlainBeasts(ap => [slain, ...ap]);
      }
      return prev.filter(b => b.id !== id);
    });
    if (selectedBeastId === id) setSelectedBeastId(null);
  }, [setBeasts, setSlainBeasts, selectedBeastId, setSelectedBeastId]);

  // Clear all active beasts (abandon all)
  const clearAll = useCallback(() => {
    if (window.confirm("Abandon all beasts? They will be recorded in your Blood Echoes.")) {
      setBeasts(prev => {
        const toArchive: SlainBeast[] = prev.map(b => ({
          id: b.id,
          text: b.text,
          threat: b.threat,
          archivedAt: Date.now(),
          fate: 'abandoned' as const,
          huntTime: b.huntTime,
          groundsId: b.groundsId,
        }));
        setSlainBeasts(ap => [...toArchive, ...ap]);
        return [];
      });
      setSelectedBeastId(null);
    }
  }, [setBeasts, setSlainBeasts, setSelectedBeastId]);

  const clearArchive = useCallback(() => {
    setSlainBeasts([]);
  }, [setSlainBeasts]);

  const selectBeast = useCallback((id: string | null) => {
    setSelectedBeastId(selectedBeastId === id ? null : id);
  }, [selectedBeastId, setSelectedBeastId]);

  // Hunt time tracking: increment by 1 second
  const addHuntSecond = useCallback((beastId: string, elapsed: number) => {
    setBeasts(prev => prev.map(b =>
      b.id === beastId ? { ...b, huntTime: elapsed } : b
    ));
  }, [setBeasts]);

  // Bulk load from remote (Supabase sync)
  const loadRemote = useCallback((remoteBeasts: Beast[], remoteSlain: SlainBeast[]) => {
    setBeasts(remoteBeasts);
    setSlainBeasts(remoteSlain);
  }, [setBeasts, setSlainBeasts]);

  return {
    beasts,
    slainBeasts,
    selectedBeastId,
    selectedBeast,
    addBeasts,
    editBeast,
    activateBeast,
    deactivateBeast,
    slayBeast,
    claimEchoes,
    reviveBeast,
    awaitInsight,
    resumeHunt,
    abandonBeast,
    clearAll,
    clearArchive,
    selectBeast,
    addHuntSecond,
    loadRemote,
    setBeasts,
  };
}
