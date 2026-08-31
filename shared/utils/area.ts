import { SQM_PER_PING } from './money';

function roundTwo(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
export function sqmToPing(value: number): number {
  if (!Number.isFinite(value) || value < 0) throw new Error('Area must be finite and non-negative');
  return roundTwo(value / SQM_PER_PING);
}
export function pingToSqm(value: number): number {
  if (!Number.isFinite(value) || value < 0) throw new Error('Area must be finite and non-negative');
  return roundTwo(value * SQM_PER_PING);
}
