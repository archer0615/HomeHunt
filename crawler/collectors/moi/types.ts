export interface RawTransaction {
  sourceId: 'moi';
  sourceFile: string;
  raw: Record<string, string>;
}
export interface MoiConfig {
  sourceId: 'moi';
  downloadUrl: string;
  timeoutMs: number;
  retries: number;
}
export interface MoiPipelineSummary {
  downloaded: number;
  parsed: number;
  normalized: number;
  persisted: number;
  skipped: number;
  failed: number;
  warnings: string[];
}
