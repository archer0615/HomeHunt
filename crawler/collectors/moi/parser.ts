import { parse } from 'csv-parse/sync';
import type { RawTransaction } from './types';
const decoder = new TextDecoder('utf-8');
export function parseCsv(csv: string, sourceFile: string): RawTransaction[] { const records = parse(csv, { columns: true, skip_empty_lines: true, bom: true }) as Record<string, string>[]; return records.map((raw) => ({ sourceId: 'moi', sourceFile, raw })); }
export function parseCsvBytes(bytes: Uint8Array, sourceFile: string): RawTransaction[] { return parseCsv(decoder.decode(bytes), sourceFile); }
export function cityFromManifestDescription(description: string | undefined): string | undefined { if (!description) return undefined; if (description.includes('臺北市')) return '臺北市'; if (description.includes('新北市')) return '新北市'; return undefined; }
export function manifestCityMap(bytes: Uint8Array): Map<string, string> { return new Map(parseCsvBytes(bytes, 'manifest.csv').flatMap((row) => { const name = row.raw['name']; const city = cityFromManifestDescription(row.raw['description']); return name && city ? [[name, city] as const] : []; })); }
export function addManifestCity(row: RawTransaction, city: string | undefined): RawTransaction { return city ? { ...row, raw: { ...row.raw, 縣市: city } } : row; }
export function assertExpectedHeaders(headers: string[], required: string[]): void { const missing = required.filter((header) => !headers.includes(header)); if (missing.length > 0) throw new Error(`SOURCE_CHANGED: missing headers ${missing.join(', ')}`); }
