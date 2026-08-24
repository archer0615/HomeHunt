import {
  listingSchema,
  publicationMetadataSchema,
  type PublicationMetadata,
} from '../../shared/schemas';
import type { Listing } from '../../shared/domain';
import type { ListingEvent, PriceHistory } from '../../shared/domain';
export type { PublicationMetadata } from '../../shared/schemas';

export const SUPPORTED_PUBLICATION_SCHEMA_VERSION = 1;
export const PUBLICATION_RESOURCES = [
  'listings/all.json',
  'history/price.ndjson',
  'history/events.ndjson',
] as const;
const DATA_CACHE_PREFIX = 'homehunt-data-';
const ACTIVE_VERSION_KEY = 'homehunt-active-app-data-version';
export class PublicationError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'PublicationError';
  }
}
export function publicationUrl(resource: string, baseUrl = import.meta.env.BASE_URL): string {
  const origin =
    typeof globalThis.location === 'undefined'
      ? 'http://localhost:5173'
      : globalThis.location.origin;
  return new URL(`data/${resource.replace(/^\//, '')}`, new URL(baseUrl, origin)).toString();
}
function canUseBrowserCache(): boolean {
  return typeof globalThis.caches !== 'undefined' && typeof globalThis.localStorage !== 'undefined';
}
function activeVersion(): string | undefined {
  try {
    return globalThis.localStorage?.getItem(ACTIVE_VERSION_KEY) ?? undefined;
  } catch {
    return undefined;
  }
}
async function cachedResponse(version: string, resource: string): Promise<Response | undefined> {
  if (!canUseBrowserCache()) return undefined;
  return (await globalThis.caches.open(`${DATA_CACHE_PREFIX}${version}`)).match(
    publicationUrl(resource),
  );
}
async function readCachedDataset(
  version: string,
): Promise<Awaited<ReturnType<typeof loadListingDetailData>> | undefined> {
  const responses = await Promise.all(
    PUBLICATION_RESOURCES.map((resource) => cachedResponse(version, resource)),
  );
  if (responses.some((response) => !response)) return undefined;
  const [listingsResponse, historyResponse, eventsResponse] = responses;
  if (!listingsResponse || !historyResponse || !eventsResponse) return undefined;
  try {
    const listings = listingSchema.array().parse(await listingsResponse.json());
    const priceHistory = (await historyResponse.text())
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line) as PriceHistory);
    const events = (await eventsResponse.text())
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line) as ListingEvent);
    return { listings, priceHistory, events };
  } catch (error) {
    throw new PublicationError('已快取的公開資料格式無效。', { cause: error });
  }
}
async function cacheDataset(metadata: PublicationMetadata, responses: Response[]): Promise<void> {
  if (!canUseBrowserCache()) return;
  const cache = await globalThis.caches.open(`${DATA_CACHE_PREFIX}${metadata.appDataVersion}`);
  await cache.put(publicationUrl('metadata.json'), new Response(JSON.stringify(metadata)));
  await Promise.all(
    responses.map((response, index) => {
      const resource = PUBLICATION_RESOURCES[index];
      if (!resource) throw new PublicationError('公開資料資源清單無效。');
      return cache.put(publicationUrl(resource), response.clone());
    }),
  );
  try {
    globalThis.localStorage.setItem(ACTIVE_VERSION_KEY, metadata.appDataVersion);
  } catch {
    /* storage is optional */
  }
  const keys = await globalThis.caches.keys();
  await Promise.all(
    keys
      .filter(
        (key) =>
          key.startsWith(DATA_CACHE_PREFIX) &&
          key !== `${DATA_CACHE_PREFIX}${metadata.appDataVersion}`,
      )
      .map((key) => globalThis.caches.delete(key)),
  );
}
export async function loadMetadata(fetcher: typeof fetch = fetch): Promise<PublicationMetadata> {
  let response: Response;
  try {
    response = await fetcher(publicationUrl('metadata.json'));
  } catch (error) {
    throw new PublicationError('無法連線至公開資料。', { cause: error });
  }
  if (!response.ok) throw new PublicationError(`公開資料無法取得（HTTP ${response.status}）。`);
  let value: unknown;
  try {
    value = await response.json();
  } catch (error) {
    throw new PublicationError('公開資料格式無效。', { cause: error });
  }
  const parsed = publicationMetadataSchema.safeParse(value);
  if (!parsed.success) throw new PublicationError('公開資料 metadata 結構無效。');
  if (parsed.data.schemaVersion !== SUPPORTED_PUBLICATION_SCHEMA_VERSION)
    throw new PublicationError(
      `資料版本不相容：預期 schemaVersion ${SUPPORTED_PUBLICATION_SCHEMA_VERSION}，實際為 ${parsed.data.schemaVersion}。`,
    );
  return parsed.data;
}
export async function loadListings(fetcher: typeof fetch = fetch): Promise<Listing[]> {
  const response = await fetcher(publicationUrl('listings/all.json'));
  if (!response.ok) throw new PublicationError(`房源資料無法取得（HTTP ${response.status}）。`);
  const parsed = listingSchema.array().safeParse(await response.json());
  if (!parsed.success) throw new PublicationError('房源資料結構無效。');
  return parsed.data;
}
async function loadNdjson<T>(resource: string, fetcher: typeof fetch): Promise<T[]> {
  const response = await fetcher(publicationUrl(resource));
  if (!response.ok) throw new PublicationError(`公開歷史資料無法取得（HTTP ${response.status}）。`);
  const text = await response.text();
  return text
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line) as T);
}
export async function loadListingDetailData(
  fetcher: typeof fetch = fetch,
): Promise<{ listings: Listing[]; priceHistory: PriceHistory[]; events: ListingEvent[] }> {
  const [listings, priceHistory, events] = await Promise.all([
    loadListings(fetcher),
    loadNdjson<PriceHistory>('history/price.ndjson', fetcher),
    loadNdjson<ListingEvent>('history/events.ndjson', fetcher),
  ]);
  return { listings, priceHistory, events };
}
export async function loadPublishedDataset(fetcher: typeof fetch = fetch): Promise<{
  metadata: PublicationMetadata;
  dataset: Awaited<ReturnType<typeof loadListingDetailData>>;
  offline: boolean;
}> {
  const version = activeVersion();
  try {
    const metadata = await loadMetadata(fetcher);
    if (version === metadata.appDataVersion) {
      const cached = await readCachedDataset(version);
      if (cached) return { metadata, dataset: cached, offline: false };
    }
    const responses = await Promise.all(
      PUBLICATION_RESOURCES.map((resource) => fetcher(publicationUrl(resource))),
    );
    if (responses.some((response) => !response.ok))
      throw new PublicationError('公開資料更新不完整。');
    const dataset = await loadListingDetailData(async (input) => {
      const resource = String(input).split('/data/')[1] as (typeof PUBLICATION_RESOURCES)[number];
      const response = responses[PUBLICATION_RESOURCES.indexOf(resource)];
      return response?.clone() ?? fetcher(input);
    });
    await cacheDataset(metadata, responses);
    return { metadata, dataset, offline: false };
  } catch (error) {
    if (version) {
      const cached = await readCachedDataset(version).catch(() => undefined);
      if (cached) {
        const metadataResponse = await cachedResponse(version, 'metadata.json');
        if (metadataResponse) {
          const metadata = publicationMetadataSchema.parse(await metadataResponse.json());
          return { metadata, dataset: cached, offline: true };
        }
      }
    }
    throw error;
  }
}
