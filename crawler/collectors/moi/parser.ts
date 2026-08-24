import { parse } from 'csv-parse/sync';
import type { RawTransaction } from './types';
const decoder = new TextDecoder('utf-8');
export function parseCsv(csv: string, sourceFile: string): RawTransaction[] { const records = parse(csv, { columns: true, skip_empty_lines: true, bom: true }) as Record<string, string>[]; return records.map((raw) => ({ sourceId: 'moi', sourceFile, raw })); }
export function parseCsvBytes(bytes: Uint8Array, sourceFile: string): RawTransaction[] { return parseCsv(decoder.decode(bytes), sourceFile); }
export function assertExpectedHeaders(headers: string[], required: string[]): void { const missing = required.filter((header) => !headers.includes(header)); if (missing.length > 0) throw new Error(`SOURCE_CHANGED: missing headers ${missing.join(', ')}`); }
