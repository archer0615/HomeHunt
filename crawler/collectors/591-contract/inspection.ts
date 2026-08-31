export type ContractInspection =
  | { status: 'SUCCESS'; items: unknown[]; total?: number; perPage?: number }
  | {
      status: 'FAILED';
      errorCode:
        'INVALID_JSON' | 'INVALID_ENVELOPE' | 'ACCESS_DENIED' | 'RATE_LIMITED' | 'NON_JSON';
    };

export function inspectSaleResponse(payload: unknown): ContractInspection {
  if (!isRecord(payload) || !isRecord(payload.data) || !Array.isArray(payload.data.house_list))
    return { status: 'FAILED', errorCode: 'INVALID_ENVELOPE' };
  return {
    status: 'SUCCESS',
    items: payload.data.house_list,
    total: numberValue(payload.data.total),
  };
}
export function inspectNewHouseResponse(payload: unknown): ContractInspection {
  if (!isRecord(payload) || !isRecord(payload.data) || !Array.isArray(payload.data.items))
    return { status: 'FAILED', errorCode: 'INVALID_ENVELOPE' };
  return {
    status: 'SUCCESS',
    items: payload.data.items,
    total: numberValue(payload.data.total),
    perPage: numberValue(payload.data.per_page),
  };
}
export function classify591HttpFailure(
  status: number,
  contentType = 'application/json',
): ContractInspection {
  if (!contentType.toLowerCase().includes('json'))
    return { status: 'FAILED', errorCode: 'NON_JSON' };
  if (status === 403) return { status: 'FAILED', errorCode: 'ACCESS_DENIED' };
  if (status === 429) return { status: 'FAILED', errorCode: 'RATE_LIMITED' };
  return { status: 'FAILED', errorCode: 'INVALID_ENVELOPE' };
}
export function parse591Json(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return { status: 'FAILED', errorCode: 'INVALID_JSON' } satisfies ContractInspection;
  }
}
function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
function numberValue(value: unknown): number | undefined {
  return typeof value === 'number' ? value : undefined;
}
