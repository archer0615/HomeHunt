import { mkdtemp, readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  buildBootstrapCandidate,
  fixtureBootstrapResults,
  promoteBootstrapCandidate,
} from '../crawler/bootstrap';

const results = () =>
  fixtureBootstrapResults(
    '縣市,交易年月日,總價元\n臺北市,1120101,25800000\n',
    '2026-08-25T00:00:00.000Z',
  );

describe('initial dataset bootstrap', () => {
  it('builds a promotable deterministic candidate with initial lifecycle semantics', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'homehunt-bootstrap-'));
    const result = await buildBootstrapCandidate({
      candidateRoot: root,
      bootstrapId: 'fixture',
      results: results(),
    });
    expect(result.summary.promotable).toBe(true);
    expect(result.summary.validation.listingCount).toBe(2);
    expect(result.summary.validation.transactionCount).toBe(1);
    const publication = JSON.parse(
      await readFile(path.join(root, 'fixture', 'publication', 'listings', 'all.json'), 'utf8'),
    ) as { status: string; missingSuccessCount: number; relistCount: number }[];
    expect(publication.every((listing) => listing.status === 'ACTIVE')).toBe(true);
    expect(
      publication.every(
        (listing) => listing.missingSuccessCount === 0 && listing.relistCount === 0,
      ),
    ).toBe(true);
  });

  it('rejects a candidate when a required source fails', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'homehunt-bootstrap-'));
    const failed = results().map((result) =>
      result.sourceId === '591-sale' ? { ...result, status: 'FAILED' as const } : result,
    );
    const result = await buildBootstrapCandidate({
      candidateRoot: root,
      bootstrapId: 'failed',
      results: failed,
    });
    expect(result.summary.promotable).toBe(false);
    expect(result.summary.validation.status).toBe('FAIL');
  });

  it('promotes a valid candidate atomically and refuses a second baseline', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'homehunt-bootstrap-'));
    const candidate = await buildBootstrapCandidate({
      candidateRoot: root,
      bootstrapId: 'promote',
      results: results(),
    });
    const dataRoot = path.join(root, 'data');
    const publicationRoot = path.join(root, 'public-data');
    await promoteBootstrapCandidate({
      candidateDir: candidate.candidateDir,
      dataRoot,
      publicationRoot,
    });
    expect(
      JSON.parse(await readFile(path.join(dataRoot, 'active-baseline.json'), 'utf8')).bootstrapId,
    ).toBe('promote');
    await expect(
      promoteBootstrapCandidate({
        candidateDir: candidate.candidateDir,
        dataRoot,
        publicationRoot,
      }),
    ).rejects.toThrow('already exists');
  });
});
