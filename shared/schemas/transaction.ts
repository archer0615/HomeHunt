import { z } from 'zod';
import { area, isoDateTime, money } from './common';
import { buildingTypes, parkingTypes, transactionTypes } from '../domain/enums';

const optionalNumber = z.number().finite().nonnegative().optional();
const optionalInteger = z.number().finite().nonnegative().int().optional();
export const transactionSchema = z.object({
  id: z.string().min(1),
  sourceId: z.string().min(1),
  transactionType: z.enum(transactionTypes),
  city: z.string().optional(),
  district: z.string().optional(),
  address: z.string().optional(),
  latitude: z.number().finite().optional(),
  longitude: z.number().finite().optional(),
  transactionDate: isoDateTime.optional(),
  totalPrice: money.optional(),
  unitPrice: optionalNumber,
  buildingArea: area.optional(),
  mainArea: area.optional(),
  auxiliaryArea: area.optional(),
  landArea: area.optional(),
  rooms: optionalInteger,
  halls: optionalInteger,
  bathrooms: optionalInteger,
  floor: optionalNumber,
  totalFloors: optionalNumber,
  buildingType: z.enum(buildingTypes).optional(),
  completionDate: isoDateTime.optional(),
  buildingAge: optionalNumber,
  hasElevator: z.boolean().optional(),
  hasParking: z.boolean().optional(),
  parkingType: z.enum(parkingTypes).optional(),
  parkingArea: area.optional(),
  parkingPrice: money.optional(),
  rawSourceId: z.string().optional(),
  createdAt: isoDateTime,
});
