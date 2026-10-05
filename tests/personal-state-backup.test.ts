import { describe, expect, it } from 'vitest';
import {
  parsePersonalStateBackup,
  serializePersonalStateBackup,
} from '../src/personal-state/backup';

describe('personal state backup', () => {
  const valid = [
    {
      listingId: 'listing-1',
      favorite: true,
      excluded: false,
      visited: false,
      tags: ['待看'],
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ];
  it('round trips valid local state', () => {
    expect(parsePersonalStateBackup(JSON.parse(serializePersonalStateBackup(valid)))).toEqual(
      valid,
    );
  });
  it('rejects malformed and duplicate state before replacing local data', () => {
    expect(() => parsePersonalStateBackup([{ ...valid[0], favorite: 'yes' }])).toThrow();
    expect(() => parsePersonalStateBackup([...valid, ...valid])).toThrow();
  });
});
