import type {
  BuildingType,
  ListingEventType,
  ListingStatus,
  ListingType,
  ParkingType,
} from './enums';

export interface Listing {
  id: string;
  sourceId: string;
  sourceListingId: string;
  propertyId?: string;
  listingType: ListingType;
  title?: string;
  city?: string;
  district?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  totalPrice?: number;
  unitPrice?: number;
  minTotalPrice?: number;
  maxTotalPrice?: number;
  minUnitPrice?: number;
  maxUnitPrice?: number;
  buildingArea?: number;
  minBuildingArea?: number;
  maxBuildingArea?: number;
  mainArea?: number;
  auxiliaryArea?: number;
  indoorArea?: number;
  commonArea?: number;
  commonAreaRatio?: number;
  landArea?: number;
  rooms?: number;
  minRooms?: number;
  maxRooms?: number;
  halls?: number;
  bathrooms?: number;
  completionDate?: string;
  buildingAge?: number;
  floor?: number;
  totalFloors?: number;
  hasElevator?: boolean;
  hasParking?: boolean;
  parkingType?: ParkingType;
  parkingPrice?: number;
  parkingIncludedInPrice?: boolean;
  managementFee?: number;
  buildingType?: BuildingType;
  nearestMrtStation?: string;
  mrtDistanceMeters?: number;
  sourceUrl?: string;
  images?: string[];
  status: ListingStatus;
  firstSeenAt: string;
  lastSeenAt: string;
  lastCheckedAt: string;
  missingSince?: string;
  delistedAt?: string;
  relistCount: number;
  missingSuccessCount: number;
  contentHash: string;
  rawDataHash: string;
  createdAt: string;
  updatedAt: string;
}

export interface PriceHistory {
  id: string;
  listingId: string;
  totalPrice?: number;
  unitPrice?: number;
  parkingPrice?: number;
  observedAt: string;
}
export interface ListingEvent {
  id: string;
  listingId: string;
  eventType: ListingEventType;
  occurredAt: string;
  oldValue?: unknown;
  newValue?: unknown;
  metadata?: Record<string, unknown>;
}
