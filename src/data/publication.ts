import { publicationMetadataSchema, type PublicationMetadata } from '../../shared/schemas';
import { listingSchema } from '../../shared/schemas';
import type { Listing } from '../../shared/domain';
import type { ListingEvent, PriceHistory } from '../../shared/domain';
export type { PublicationMetadata } from '../../shared/schemas';

export const SUPPORTED_PUBLICATION_SCHEMA_VERSION = 1;
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
