import { mkdtemp, readFile, rm, writeFile, mkdir, rename } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { promoteArtifacts } from '../crawler/refresh/promotion';

describe('candidate promotion rollback', () => {
  it('restores database and publication if publication install fails after database install', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'homehunt-promote-'));
    const db = path.join(root, 'canonical.sqlite');
    const pub = path.join(root, 'public');
    const dbStage = path.join(root, 'canonical.stage');
    const pubStage = path.join(root, 'public.stage');
    const dbBackup = path.join(root, 'canonical.previous');
    const pubBackup = path.join(root, 'public.previous');
    await writeFile(db, 'known-good-db');
    await mkdir(pub);
    await writeFile(path.join(pub, 'metadata.json'), 'known-good-publication');
    await writeFile(dbStage, 'candidate-db');
    await mkdir(pubStage);
    await writeFile(path.join(pubStage, 'metadata.json'), 'candidate-publication');
    let renames = 0;
    const failingFileSystem = {
      rename: async (from: string, to: string) => {
        renames += 1;
        if (renames === 4) throw new Error('simulated publication install failure');
        await rename(from, to);
      },
      rm,
    };
    await expect(
      promoteArtifacts(
        [
          { stage: dbStage, target: db, backup: dbBackup },
          { stage: pubStage, target: pub, backup: pubBackup, recursive: true },
        ],
        failingFileSystem,
      ),
    ).rejects.toThrow('simulated publication install failure');
    expect(await readFile(db, 'utf8')).toBe('known-good-db');
    expect(await readFile(path.join(pub, 'metadata.json'), 'utf8')).toBe('known-good-publication');
    await rm(root, { recursive: true, force: true });
  });
});
