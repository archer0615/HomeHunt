import type { SourceExecutionMode, SourceType } from './enums';

export interface Source {
  id: string;
  name: string;
  sourceType: SourceType;
  baseUrl?: string;
  enabled: boolean;
  executionMode: SourceExecutionMode;
  crawlIntervalMinutes?: number;
  lastSuccessAt?: string;
  lastFailureAt?: string;
  consecutiveFailures: number;
  createdAt: string;
  updatedAt: string;
}
