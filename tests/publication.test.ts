import { mkdtemp, readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import type { Listing } from '../shared/domain';
import { publishData, type PublicationInput } from '../crawler/publication';

const listing = (id: string): Listing => ({
  id,
  sourceId: '591-sale',
  sourceListingId: id,
  listingType: 'USED',
  title: `Listing ${id}`,
  totalPrice: 10_000_000,
  minTotalPrice: undefined,
  maxTotalPrice: undefined,
  status: 'ACTIVE',
  firstSeenAt: '2026-01-01T00:00:00.000Z',
  lastSeenAt: '2026-01-01T00:00:00.000Z',
  lastCheckedAt: '2026-01-01T00:00:00.000Z',
  relistCount: 0,
  missingSuccessCount: 0,
  contentHash: `content-${id}`,
  rawDataHash: `raw-${id}`,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
});

const input = (ids: string[]): PublicationInput => ({
  listings: ids.map(listing),
  priceHistory: [],
  listingEvents: [],
  transactions: [],
});

describe('data publication', () => {
  it('exports deterministic data and content-based appDataVersion', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'homehunt-publication-'));
    const first = await publishData(input(['b', 'a']), {
      targetDir: path.join(root, 'one'),
      generatedAt: '2026-01-01T00:00:00.000Z',
    });
    const second = await publishData(input(['a', 'b']), {
      targetDir: path.join(root, 'two'),
      generatedAt: '2026-01-01T00:00:00.000Z',
    });
    expect(second.appDataVersion).toBe(first.appDataVersion);
    expect(await readFile(path.join(root, 'one', 'listings', 'all.json'), 'utf8')).toBe(
      await readFile(path.join(root, 'two', 'listings', 'all.json'), 'utf8'),
    );
  });

  it('preserves known-good publication when anomaly guard rejects new data', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'homehunt-publication-'));
    const target = path.join(root, 'data');
    await publishData(input(Array.from({ length: 10 }, (_, i) => String(i))), {
      targetDir: target,
      generatedAt: '2026-01-01T00:00:00.000Z',
    });
    await expect(
      publishData(input(['only']), {
        targetDir: target,
        previousInput: input(Array.from({ length: 10 }, (_, i) => String(i))),
        generatedAt: '2026-01-02T00:00:00.000Z',
        anomalyGuard: { minimumPreviousCount: 5, maximumDropRatio: 0.5 },
      }),
    ).rejects.toThrow('anomaly');
    expect(
      JSON.parse(await readFile(path.join(target, 'listings', 'all.json'), 'utf8')),
    ).toHaveLength(10);
  });
});
