import Dexie, { type Table } from 'dexie';
import type { ListingPersonalState } from './types';

export const PERSONAL_STATE_DB_NAME = 'homehunt-personal-state';
export const PERSONAL_STATE_DB_VERSION = 1;
export class PersonalStateDatabase extends Dexie {
  states!: Table<ListingPersonalState, string>;
  constructor(name = PERSONAL_STATE_DB_NAME) {
    super(name);
    this.version(PERSONAL_STATE_DB_VERSION).stores({
      states: 'listingId, updatedAt, favorite, excluded, visited',
    });
  }
}
export class PersonalStateRepository {
  constructor(readonly db = new PersonalStateDatabase()) {}
  async getAll(): Promise<ListingPersonalState[]> {
    return this.db.states.toArray();
  }
  async get(listingId: string): Promise<ListingPersonalState | undefined> {
    return this.db.states.get(listingId);
  }
  async set(
    listingId: string,
    patch: Partial<Pick<ListingPersonalState, 'favorite' | 'excluded' | 'visited'>>,
  ): Promise<ListingPersonalState> {
    const current = await this.get(listingId);
    const next: ListingPersonalState = {
      listingId,
      favorite: current?.favorite ?? false,
      excluded: current?.excluded ?? false,
      visited: current?.visited ?? false,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    await this.db.states.put(next);
    return next;
  }
  async close(): Promise<void> {
    this.db.close();
  }
}
