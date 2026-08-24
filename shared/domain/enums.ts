export const listingTypes = ['USED', 'NEW', 'PRESALE', 'UNKNOWN'] as const;
export type ListingType = (typeof listingTypes)[number];

export const listingStatuses = ['ACTIVE', 'MISSING', 'DELISTED'] as const;
export type ListingStatus = (typeof listingStatuses)[number];

export const listingEventTypes = ['LISTING_DISCOVERED', 'PRICE_DECREASED', 'PRICE_INCREASED', 'MARKED_MISSING', 'RESTORED', 'DELISTED', 'RELISTED', 'CONTENT_CHANGED'] as const;
export type ListingEventType = (typeof listingEventTypes)[number];

export const buildingTypes = ['RESIDENTIAL_HIGHRISE', 'MIDRISE', 'APARTMENT', 'TOWNHOUSE', 'STUDIO', 'VILLA', 'OTHER', 'UNKNOWN'] as const;
export type BuildingType = (typeof buildingTypes)[number];

export const parkingTypes = ['RAMP_FLAT', 'RAMP_MECHANICAL', 'LIFT_FLAT', 'LIFT_MECHANICAL', 'PLANE', 'OTHER', 'UNKNOWN'] as const;
export type ParkingType = (typeof parkingTypes)[number];

export const transactionTypes = ['USED', 'PRESALE'] as const;
export type TransactionType = (typeof transactionTypes)[number];

export const sourceTypes = ['listing', 'transaction'] as const;
export type SourceType = (typeof sourceTypes)[number];

export const sourceExecutionModes = ['github_actions', 'local', 'manual'] as const;
export type SourceExecutionMode = (typeof sourceExecutionModes)[number];

export const crawlRunStatuses = ['RUNNING', 'SUCCESS', 'PARTIAL', 'FAILED'] as const;
export type CrawlRunStatus = (typeof crawlRunStatuses)[number];
