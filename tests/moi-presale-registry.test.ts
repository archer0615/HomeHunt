import { describe, expect, it } from 'vitest';
import { parsePresaleProjects } from '../crawler/collectors/moi-presale-registry/parser';
import { normalizePresaleProject } from '../crawler/collectors/moi-presale-registry/normalizer';

describe('MOI presale registry collector', () => {
  it('parses and normalizes an official project row', () => {
    const rows = parsePresaleProjects('鄉鎮市區,建案名稱,坐落街道,起造人,層棟戶數,使用分區,主要用途,主要建材,申報備查日期,銷售期間,建照核發日期,建造執照,編號\n大安區,測試建案,測試路1號,測試建設,120,住宅區,集合住宅,鋼筋混凝土造,1150101,自售:1150101~售完,1140101,114建字第0001號,ABC123\n', 'a_lvr_buildcase.csv', '臺北市');
    const project = normalizePresaleProject(rows[0]!, '2026-08-28T00:00:00.000Z');
    expect(project.id).toBe('moi-presale-registry:ABC123');
    expect(project.city).toBe('臺北市');
    expect(project.projectName).toBe('測試建案');
    expect(project.householdCount).toBe(120);
    expect(project.buildingPermitNumber).toBe('114建字第0001號');
  });

  it('uses a deterministic fallback identity when official number is missing', () => {
    const rows = parsePresaleProjects('鄉鎮市區,建案名稱\n板橋區,無編號建案\n', 'b_lvr_buildcase.csv', '新北市');
    expect(normalizePresaleProject(rows[0]!, '2026-08-28T00:00:00.000Z').id).toBe('moi-presale-registry:b_lvr_buildcase.csv:無編號建案');
  });
});
