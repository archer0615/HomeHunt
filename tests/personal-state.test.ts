import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { PersonalStateDatabase, PersonalStateRepository } from '../src/personal-state/repository';
describe('personal state repository', () => {
  it('initializes schema and persists independent combined state', async () => {
    const name = `test-${Date.now()}-${Math.random()}`;
    const first = new PersonalStateRepository(new PersonalStateDatabase(name));
    await expect(first.get('591-sale:missing')).resolves.toBeUndefined();
    await first.set('591-sale:a', { favorite: true, visited: true, tags: ['待看', '近捷運'] });
    await first.set('591-sale:b', { excluded: true });
    await first.close();
    const second = new PersonalStateRepository(new PersonalStateDatabase(name));
    await expect(second.get('591-sale:a')).resolves.toMatchObject({
      listingId: '591-sale:a',
      favorite: true,
      visited: true,
      excluded: false,
      tags: ['待看', '近捷運'],
    });
    await expect(second.get('591-sale:b')).resolves.toMatchObject({ excluded: true });
    await second.set('591-sale:b', { excluded: false });
    await expect(second.get('591-sale:b')).resolves.toMatchObject({ excluded: false });
    await second.close();
  });
  it('keeps personal state separate from published listings', async () => {
    const name = `test-${Date.now()}-${Math.random()}`;
    const repository = new PersonalStateRepository(new PersonalStateDatabase(name));
    await repository.set('591-sale:private', { favorite: true, excluded: true });
    expect(await repository.getAll()).toHaveLength(1);
    expect(await repository.get('591-sale:private')).toMatchObject({
      favorite: true,
      excluded: true,
    });
    await repository.close();
  });
  it('replaces all state for a confirmed local backup restore', async () => {
    const name = `test-${Date.now()}-${Math.random()}`;
    const repository = new PersonalStateRepository(new PersonalStateDatabase(name));
    await repository.set('old', { favorite: true });
    await repository.replaceAll([
      {
        listingId: 'restored',
        favorite: false,
        excluded: true,
        visited: true,
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ]);
    await expect(repository.getAll()).resolves.toEqual([
      {
        listingId: 'restored',
        favorite: false,
        excluded: true,
        visited: true,
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ]);
    await repository.close();
  });
});
