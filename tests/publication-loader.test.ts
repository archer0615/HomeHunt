import { describe, expect, it, vi } from 'vitest';
import { loadMetadata, publicationUrl } from '../src/data/publication';

const metadata = {
  schemaVersion: 1,
  appDataVersion: 'sha256-test',
  generatedAt: '2026-01-01T00:00:00.000Z',
  counts: { listings: 2, priceHistory: 0, listingEvents: 0, transactions: 0 },
  sources: [],
};
describe('publication loader', () => {
  it('resolves data URL under the configured base path', () => {
    expect(publicationUrl('metadata.json', '/HomeHunt/')).toBe(
      'http://localhost:5173/HomeHunt/data/metadata.json',
    );
  });
  it('loads compatible metadata and rejects unsupported schema', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify(metadata), { status: 200 }));
    expect((await loadMetadata(fetcher)).appDataVersion).toBe('sha256-test');
    await expect(
      loadMetadata(
        vi
          .fn()
          .mockResolvedValue(
            new Response(JSON.stringify({ ...metadata, schemaVersion: 2 }), { status: 200 }),
          ),
      ),
    ).rejects.toThrow('預期 schemaVersion 1，實際為 2');
  });
  it('surfaces fetch failures as a user-facing publication error', async () => {
    await expect(loadMetadata(vi.fn().mockRejectedValue(new Error('offline')))).rejects.toThrow(
      '無法連線至公開資料',
    );
  });
});
