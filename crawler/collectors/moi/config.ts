import type { MoiConfig } from './types';
export const moiConfig: MoiConfig = {
  sourceId: 'moi',
  downloadUrl: 'https://plvr.land.moi.gov.tw/Download?type=zip&fileName=lvr_landcsv.zip',
  timeoutMs: 30_000,
  retries: 3,
};
