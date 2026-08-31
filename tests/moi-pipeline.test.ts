import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  addManifestCity,
  assertExpectedHeaders,
  cityFromManifestDescription,
  manifestCityMap,
  parseCsv,
  parseCsvBytes,
} from '../crawler/collectors/moi/parser';
import {
  mapBuildingType,
  normalizeMoi,
  parseFloor,
  parseRocDate,
  transactionId,
} from '../crawler/collectors/moi/normalizer';
import { normalizeMoiArchive, runMoiCsvPipeline } from '../crawler/pipeline/moi';
import { createTransactionRepository } from '../crawler/persistence/sqlite';
const csv = readFileSync(resolve('tests/fixtures/moi/transactions.csv'));
describe('MOI pipeline', () => {
  it('parses CSV rows', () => {
    expect(parseCsvBytes(csv, 'transactions.csv')).toHaveLength(2);
  });
  it('maps MOI file city from manifest metadata', () => {
    const map = manifestCityMap(
      new TextEncoder().encode(
        'name,schema,description\na_lvr_land_a.csv,schema-main.csv,臺北市不動產買賣\nf_lvr_land_a.csv,schema-main.csv,新北市不動產買賣\n',
      ),
    );
    expect(map.get('a_lvr_land_a.csv')).toBe('臺北市');
    expect(map.get('f_lvr_land_a.csv')).toBe('新北市');
    expect(cityFromManifestDescription('桃園市不動產買賣')).toBeUndefined();
    expect(
      normalizeMoi(addManifestCity(parseCsvBytes(csv, 'a_lvr_land_a.csv')[0]!, '臺北市')).city,
    ).toBe('臺北市');
  });
  it('normalizes an archive through manifest city metadata and production boundaries', () => {
    const archive = {
      'manifest.csv': new TextEncoder().encode(
        'name,schema,description\na_lvr_land_a.csv,schema-main.csv,臺北市不動產買賣\nf_lvr_land_a.csv,schema-main.csv,新北市不動產買賣\n',
      ),
      'a_lvr_land_a.csv': new TextEncoder().encode(
        '鄉鎮市區,交易標的,交易年月日,土地位置建物門牌,總價元\n信義區,房地(土地+建物),1150701,臺北市信義區測試路1號,10000000\n',
      ),
      'f_lvr_land_a.csv': new TextEncoder().encode(
        '鄉鎮市區,交易標的,交易年月日,土地位置建物門牌,總價元\n桃園區,房地(土地+建物),1150701,桃園市測試路1號,10000000\n',
      ),
    };
    const transactions = normalizeMoiArchive(archive, '2026-08-25T00:00:00.000Z');
    expect(transactions).toHaveLength(1);
    expect(transactions[0]?.city).toBe('臺北市');
    expect(transactions[0]?.district).toBe('信義區');
  });
  it('handles quoted commas and rejects changed headers', () => {
    expect(
      parseCsv('地址,備註\n"信義路一段, 1 號","含,逗號"\n', 'quoted.csv')[0]!.raw['地址'],
    ).toBe('信義路一段, 1 號');
    expect(() => assertExpectedHeaders(['unexpected'], ['交易年月日'])).toThrow(/SOURCE_CHANGED/);
  });
  it('normalizes date, area, unit price, floor and mappings', () => {
    const row = parseCsvBytes(csv, 'transactions.csv')[0]!;
    const tx = normalizeMoi(row);
    expect(tx.transactionDate).toBe('2023-01-01T00:00:00+08:00');
    expect(tx.buildingArea).toBe(27.83);
    expect(tx.unitPrice).toBeGreaterThan(2_000_000);
    expect(tx.floor).toBe(8);
    expect(tx.parkingType).toBe('RAMP_FLAT');
  });
  it('keeps deterministic identity and unknown optional values', () => {
    const rows = parseCsvBytes(csv, 'transactions.csv');
    expect(transactionId(rows[0]!)).toBe(transactionId(rows[0]!));
    const tx = normalizeMoi(rows[1]!);
    expect(tx.mainArea).toBeUndefined();
    expect(tx.hasParking).toBeUndefined();
    expect(mapBuildingType('未定義')).toBe('UNKNOWN');
    expect(parseFloor('全')).toBeUndefined();
    expect(parseRocDate('112/01/01')).toContain('2023');
  });
  it('upserts duplicate transactions without increasing count', () => {
    const repo = createTransactionRepository();
    const row = parseCsvBytes(csv, 'transactions.csv')[0]!;
    const tx = normalizeMoi(row);
    repo.upsert(tx);
    repo.upsert(tx);
    expect(repo.count()).toBe(1);
    expect(repo.findById(tx.id)?.id).toBe(tx.id);
    repo.close();
  });
  it('runs the offline pipeline and skips malformed rows', () => {
    const repo = createTransactionRepository();
    const result = runMoiCsvPipeline(
      new TextEncoder().encode('縣市,總價元\n臺北市,-1\n'),
      'bad.csv',
      repo,
    );
    expect(result.persisted).toBe(0);
    expect(result.failed).toBe(1);
    repo.close();
  });
});
