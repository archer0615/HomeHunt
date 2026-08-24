import { z } from 'zod';

export const isoDateTime = z.string().datetime({ offset: true });
export const money = z.number().finite().nonnegative().int();
export const area = z.number().finite().nonnegative();
export const optionalMoney = money.optional();
export const optionalArea = area.optional();
export const optionalBoolean = z.boolean().optional();
