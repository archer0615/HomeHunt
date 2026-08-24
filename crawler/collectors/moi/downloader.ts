import { unzipSync } from 'fflate';
import type { MoiConfig } from './types';
export async function downloadMoiArchive(config: MoiConfig, fetchImpl: typeof fetch = fetch): Promise<Uint8Array> { const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), config.timeoutMs); try { const response = await fetchImpl(config.downloadUrl, { signal: controller.signal }); if (!response.ok) throw new Error(`MOI download failed: HTTP ${response.status}`); return new Uint8Array(await response.arrayBuffer()); } finally { clearTimeout(timeout); } }
export function discoverCsvFiles(archive: Uint8Array): Record<string, Uint8Array> { const files = unzipSync(archive); return Object.fromEntries(Object.entries(files).filter(([name]) => name.toLowerCase().endsWith('.csv'))); }
