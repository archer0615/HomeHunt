import type { ListingPersonalState } from './types';

export function parsePersonalStateBackup(value: unknown): ListingPersonalState[] {
  if (!Array.isArray(value)) throw new Error('備份檔格式錯誤。');
  const seen = new Set<string>();
  return value.map((item) => {
    if (!item || typeof item !== 'object') throw new Error('備份檔含有無效狀態。');
    const record = item as Record<string, unknown>;
    if (
      typeof record.listingId !== 'string' ||
      !record.listingId ||
      seen.has(record.listingId) ||
      typeof record.favorite !== 'boolean' ||
      typeof record.excluded !== 'boolean' ||
      typeof record.visited !== 'boolean' ||
      (record.tags !== undefined &&
        (!Array.isArray(record.tags) || record.tags.some((tag) => typeof tag !== 'string'))) ||
      typeof record.updatedAt !== 'string' ||
      !Number.isFinite(Date.parse(record.updatedAt))
    )
      throw new Error('備份檔含有無效或重複的個人狀態。');
    seen.add(record.listingId);
    return {
      listingId: record.listingId,
      favorite: record.favorite,
      excluded: record.excluded,
      visited: record.visited,
      ...(Array.isArray(record.tags) ? { tags: record.tags } : {}),
      updatedAt: record.updatedAt,
    };
  });
}
export function serializePersonalStateBackup(states: ListingPersonalState[]): string {
  return JSON.stringify(states, null, 2);
}
