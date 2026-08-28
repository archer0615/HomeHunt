import type { PresaleProject } from '../../../shared/domain';
import type { RawPresaleProject } from './types';

const text = (value: string | undefined): string | undefined => value?.trim() || undefined;
const number = (value: string | undefined): number | undefined => {
  const result = Number(value?.replace(/,/g, '').trim());
  return Number.isFinite(result) && result >= 0 ? result : undefined;
};

export function normalizePresaleProject(raw: RawPresaleProject, updatedAt = new Date().toISOString()): PresaleProject {
  const row = raw.raw;
  const sourceId = text(row['編號']) ?? `${raw.sourceFile}:${row['建案名稱'] ?? row['坐落街道'] ?? 'unknown'}`;
  return {
    id: `moi-presale-registry:${sourceId}`,
    sourceId: 'moi-presale-registry',
    projectName: text(row['建案名稱']),
    city: raw.city,
    district: text(row['鄉鎮市區']),
    address: text(row['坐落街道']),
    builder: text(row['起造人']),
    householdCount: number(row['層棟戶數']),
    useZoning: text(row['使用分區']),
    mainUse: text(row['主要用途']),
    mainMaterial: text(row['主要建材']),
    declaredDate: text(row['申報備查日期']),
    sellingPeriod: text(row['銷售期間']),
    buildingPermitDate: text(row['建照核發日期']),
    buildingPermitNumber: text(row['建造執照']),
    firstRegistrationDate: text(row['第1次登記日期']),
    sourceUrl: 'https://plvr.land.moi.gov.tw/DownloadOpenData',
    updatedAt,
  };
}
