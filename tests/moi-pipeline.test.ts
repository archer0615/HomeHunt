import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { assertExpectedHeaders, parseCsv, parseCsvBytes } from '../crawler/collectors/moi/parser';
import { mapBuildingType, normalizeMoi, parseFloor, parseRocDate, transactionId } from '../crawler/collectors/moi/normalizer';
import { runMoiCsvPipeline } from '../crawler/pipeline/moi';
import { createTransactionRepository } from '../crawler/persistence/sqlite';
const csv = readFileSync(resolve('tests/fixtures/moi/transactions.csv'));
describe('MOI pipeline', () => {
  it('parses CSV rows', () => { expect(parseCsvBytes(csv, 'transactions.csv')).toHaveLength(2); });
  it('handles quoted commas and rejects changed headers', () => { expect(parseCsv('地址,備註\n"信義路一段, 1 號","含,逗號"\n', 'quoted.csv')[0]!.raw['地址']).toBe('信義路一段, 1 號'); expect(() => assertExpectedHeaders(['unexpected'], ['交易年月日'])).toThrow(/SOURCE_CHANGED/); });
  it('normalizes date, area, unit price, floor and mappings', () => { const row = parseCsvBytes(csv, 'transactions.csv')[0]!; const tx = normalizeMoi(row); expect(tx.transactionDate).toBe('2023-01-01T00:00:00+08:00'); expect(tx.buildingArea).toBe(27.83); expect(tx.unitPrice).toBeGreaterThan(2_000_000); expect(tx.floor).toBe(8); expect(tx.parkingType).toBe('RAMP_FLAT'); });
  it('keeps deterministic identity and unknown optional values', () => { const rows = parseCsvBytes(csv, 'transactions.csv'); expect(transactionId(rows[0]!)).toBe(transactionId(rows[0]!)); const tx = normalizeMoi(rows[1]!); expect(tx.mainArea).toBeUndefined(); expect(tx.hasParking).toBeUndefined(); expect(mapBuildingType('未定義')).toBe('UNKNOWN'); expect(parseFloor('全')).toBeUndefined(); expect(parseRocDate('112/01/01')).toContain('2023'); });
  it('upserts duplicate transactions without increasing count', () => { const repo = createTransactionRepository(); const row = parseCsvBytes(csv, 'transactions.csv')[0]!; const tx = normalizeMoi(row); repo.upsert(tx); repo.upsert(tx); expect(repo.count()).toBe(1); expect(repo.findById(tx.id)?.id).toBe(tx.id); repo.close(); });
  it('runs the offline pipeline and skips malformed rows', () => { const repo = createTransactionRepository(); const result = runMoiCsvPipeline(new TextEncoder().encode('縣市,總價元\n臺北市,-1\n'), 'bad.csv', repo); expect(result.persisted).toBe(0); expect(result.failed).toBe(1); repo.close(); });
});
