import { z } from 'zod';
import { area, isoDateTime, money } from './common';
import { buildingTypes, listingEventTypes, listingStatuses, listingTypes, parkingTypes } from '../domain/enums';

const optionalText = z.string().optional();
const optionalNumber = z.number().finite().nonnegative().optional();
const optionalInteger = z.number().finite().nonnegative().int().optional();

export const listingSchema = z.object({
  id: z.string().min(1), sourceId: z.string().min(1), sourceListingId: z.string().min(1), propertyId: optionalText,
  listingType: z.enum(listingTypes), title: optionalText, city: optionalText, district: optionalText, address: optionalText,
  latitude: z.number().finite().optional(), longitude: z.number().finite().optional(), totalPrice: money.optional(), unitPrice: optionalNumber,
  minTotalPrice: money.optional(), maxTotalPrice: money.optional(), minUnitPrice: optionalNumber, maxUnitPrice: optionalNumber,
  buildingArea: area.optional(), minBuildingArea: area.optional(), maxBuildingArea: area.optional(), mainArea: area.optional(), auxiliaryArea: area.optional(), indoorArea: area.optional(), commonArea: area.optional(), commonAreaRatio: optionalNumber, landArea: area.optional(),
  rooms: optionalInteger, minRooms: optionalInteger, maxRooms: optionalInteger, halls: optionalInteger, bathrooms: optionalInteger, completionDate: isoDateTime.optional(), buildingAge: optionalNumber, floor: optionalNumber, totalFloors: optionalNumber,
  hasElevator: z.boolean().optional(), hasParking: z.boolean().optional(), parkingType: z.enum(parkingTypes).optional(), parkingPrice: money.optional(), parkingIncludedInPrice: z.boolean().optional(), managementFee: money.optional(), buildingType: z.enum(buildingTypes).optional(), nearestMrtStation: optionalText, mrtDistanceMeters: optionalNumber, sourceUrl: z.string().url().optional(),
  status: z.enum(listingStatuses), firstSeenAt: isoDateTime, lastSeenAt: isoDateTime, lastCheckedAt: isoDateTime, missingSince: isoDateTime.optional(), delistedAt: isoDateTime.optional(), relistCount: optionalInteger, missingSuccessCount: optionalInteger, contentHash: z.string().min(1), rawDataHash: z.string().min(1), createdAt: isoDateTime, updatedAt: isoDateTime,
});

export const priceHistorySchema = z.object({ id: z.string().min(1), listingId: z.string().min(1), totalPrice: money.optional(), unitPrice: optionalNumber, parkingPrice: money.optional(), observedAt: isoDateTime });
export const listingEventSchema = z.object({ id: z.string().min(1), listingId: z.string().min(1), eventType: z.enum(listingEventTypes), occurredAt: isoDateTime, oldValue: z.unknown().optional(), newValue: z.unknown().optional(), metadata: z.record(z.string(), z.unknown()).optional() });
