import type { MoiConfig } from './types';
export const moiConfig: MoiConfig = {
  sourceId: 'moi',
  liveDownloadEnabled: false,
  downloadUrl: 'https://plvr.land.moi.gov.tw/Download?type=zip&fileName=lvr_landcsv.zip',
  timeoutMs: 30_000,
  retries: 3,
};

export function assertMoiLiveDownloadEnabled(): void {
  if (!moiConfig.liveDownloadEnabled) {
    throw new Error('LIVE_DOWNLOAD_PAUSED: MOI download authorization not confirmed');
  }
}
