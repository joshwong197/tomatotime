import { Beast, SlainBeast, HuntingGround } from '../types';

const MIGRATION_KEY = 'tomato_migrated_v2';

interface OldSeed {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
  priority: 'sun' | 'partial' | 'shade';
  status: 'active' | 'backlog' | 'greenhouse';
  focusTime: number;
  gardenBedId?: string;
}

interface OldArchivedSeed {
  id: string;
  text: string;
  priority: 'sun' | 'partial' | 'shade';
  archivedAt: number;
  archiveReason: 'completed' | 'deleted';
  focusTime: number;
  gardenBedId?: string;
}

interface OldGardenBed {
  id: string;
  name: string;
  createdAt: number;
  x?: number;
  y?: number;
}

function mapPriority(priority: string): Beast['threat'] {
  switch (priority) {
    case 'sun': return 'nightmare';
    case 'partial': return 'boss';
    case 'shade': return 'beast';
    default: return 'boss';
  }
}

function migrateSeed(seed: OldSeed): Beast {
  let status: Beast['status'];
  if (seed.completed && seed.status === 'greenhouse') {
    status = 'on_hold';
  } else if (seed.completed && seed.status === 'backlog') {
    status = 'done';
  } else if (seed.status === 'active') {
    status = 'active';
  } else {
    status = 'backlog';
  }

  return {
    id: seed.id,
    text: seed.text,
    status,
    threat: mapPriority(seed.priority),
    createdAt: seed.createdAt,
    huntTime: seed.focusTime || 0,
    groundsId: seed.gardenBedId,
    slainAt: status === 'done' ? Date.now() : undefined,
  };
}

function migrateArchivedSeed(seed: OldArchivedSeed): SlainBeast {
  return {
    id: seed.id,
    text: seed.text,
    threat: mapPriority(seed.priority),
    archivedAt: seed.archivedAt,
    fate: seed.archiveReason === 'completed' ? 'slain' : 'abandoned',
    huntTime: seed.focusTime || 0,
    groundsId: seed.gardenBedId,
  };
}

function migrateGardenBed(bed: OldGardenBed): HuntingGround {
  return {
    id: bed.id,
    name: bed.name,
    createdAt: bed.createdAt,
  };
}

export function runMigration(): void {
  if (localStorage.getItem(MIGRATION_KEY) === 'true') return;

  try {
    // Migrate seeds → beasts
    const rawSeeds = localStorage.getItem('tomato_seeds');
    if (rawSeeds) {
      const seeds: OldSeed[] = JSON.parse(rawSeeds);
      const beasts: Beast[] = seeds.map(migrateSeed);
      localStorage.setItem('tomato_seeds', JSON.stringify(beasts));
    }

    // Migrate archived seeds → slain beasts
    const rawArchived = localStorage.getItem('tomato_archived_seeds');
    if (rawArchived) {
      const archived: OldArchivedSeed[] = JSON.parse(rawArchived);
      const slain: SlainBeast[] = archived.map(migrateArchivedSeed);
      localStorage.setItem('tomato_archived_seeds', JSON.stringify(slain));
    }

    // Migrate garden beds → hunting grounds
    const rawBeds = localStorage.getItem('tomato_garden_beds');
    if (rawBeds) {
      const beds: OldGardenBed[] = JSON.parse(rawBeds);
      const grounds: HuntingGround[] = beds.map(migrateGardenBed);
      localStorage.setItem('tomato_garden_beds', JSON.stringify(grounds));
    }

    // Drop plant sprites
    localStorage.removeItem('tomato_plant_sprites');

    // Migrate selected task key (same key, no change needed)

    localStorage.setItem(MIGRATION_KEY, 'true');
  } catch (e) {
    console.error('Migration failed:', e);
    // Don't block the app — migration is best-effort
    localStorage.setItem(MIGRATION_KEY, 'true');
  }
}
