import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { HuntingGround } from '../types';

export function useHuntingGrounds() {
  const [grounds, setGrounds] = useLocalStorage<HuntingGround[]>('tomato_garden_beds', []);

  const addGround = useCallback((name: string) => {
    const ground: HuntingGround = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      createdAt: Date.now(),
    };
    setGrounds(prev => [...prev, ground]);
    return ground;
  }, [setGrounds]);

  const editGround = useCallback((id: string, name: string) => {
    setGrounds(prev => prev.map(g => g.id === id ? { ...g, name } : g));
  }, [setGrounds]);

  const deleteGround = useCallback((id: string) => {
    setGrounds(prev => prev.filter(g => g.id !== id));
  }, [setGrounds]);

  const loadRemote = useCallback((remoteGrounds: HuntingGround[]) => {
    setGrounds(remoteGrounds);
  }, [setGrounds]);

  return {
    grounds,
    addGround,
    editGround,
    deleteGround,
    loadRemote,
  };
}
