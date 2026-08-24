export const NTD_PER_WAN = 10_000;
export const SQM_PER_PING = 3.305785;

export function wanToNtd(wan: number): number {
  if (!Number.isFinite(wan) || wan < 0) throw new Error('Money must be finite and non-negative');
  return Math.round(wan * NTD_PER_WAN);
}

export function ntdPerSquareMeterToNtdPerPing(value: number): number {
  if (!Number.isFinite(value) || value < 0) throw new Error('Unit price must be finite and non-negative');
  return value * SQM_PER_PING;
}
