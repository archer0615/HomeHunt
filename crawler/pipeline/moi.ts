import { parseCsvBytes } from '../collectors/moi/parser';
import { normalizeMoi } from '../collectors/moi/normalizer';
import type { MoiPipelineSummary } from '../collectors/moi/types';
import { createTransactionRepository, type TransactionRepository } from '../persistence/sqlite';
export function runMoiCsvPipeline(bytes: Uint8Array, sourceFile: string, repository: TransactionRepository = createTransactionRepository()): MoiPipelineSummary { const summary: MoiPipelineSummary = { downloaded: 0, parsed: 0, normalized: 0, persisted: 0, skipped: 0, failed: 0, warnings: [] }; const rows = parseCsvBytes(bytes, sourceFile); summary.parsed = rows.length; for (const row of rows) { try { const transaction = normalizeMoi(row); repository.upsert(transaction); summary.normalized += 1; summary.persisted += 1; } catch (error) { summary.skipped += 1; summary.failed += 1; summary.warnings.push(error instanceof Error ? error.message : 'UNKNOWN'); } } return summary; }
