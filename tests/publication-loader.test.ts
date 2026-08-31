import { describe, expect, it, vi } from 'vitest';
import { loadMetadata, loadPublishedDataset, publicationUrl } from '../src/data/publication';

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
  it('falls back to the last complete cached dataset when the network fails', async () => {
    const stores = new Map<string, Map<string, Response>>();
    const caches = {
      open: async (name: string) => {
        const store = stores.get(name) ?? new Map<string, Response>();
        stores.set(name, store);
        return {
          match: async (key: string) => store.get(key)?.clone(),
          put: async (key: string, response: Response) => {
            store.set(key, response.clone());
          },
        };
      },
      keys: async () => [...stores.keys()],
      delete: async (name: string) => stores.delete(name),
    };
    vi.stubGlobal('caches', caches);
    vi.stubGlobal('localStorage', {
      values: new Map<string, string>(),
      getItem(key: string) {
        return this.values.get(key) ?? null;
      },
      setItem(key: string, value: string) {
        this.values.set(key, value);
      },
    });
    const fetcher = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/metadata.json')) return new Response(JSON.stringify(metadata));
      if (url.endsWith('/listings/all.json')) return new Response('[]');
      return new Response('');
    });
    await loadPublishedDataset(fetcher);
    fetcher.mockRejectedValue(new Error('offline'));
    const offline = await loadPublishedDataset(fetcher);
    expect(offline.offline).toBe(true);
    expect(offline.metadata.appDataVersion).toBe(metadata.appDataVersion);
    expect(offline.dataset.listings).toEqual([]);
  });
});
