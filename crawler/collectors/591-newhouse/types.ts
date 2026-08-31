export interface Raw591NewHouseListing {
  projectId?: string;
  projectName?: string;
  projectType?: string;
  city?: string;
  district?: string;
  priceText?: string;
  unitPriceText?: string;
  areaText?: string;
  roomText?: string;
  mrtText?: string;
  addressText?: string;
  sourceUrl?: string;
  rawStatus?: string;
  raw: Record<string, unknown>;
}
export type NewHouseCollectorStatus = 'SUCCESS' | 'PARTIAL' | 'FAILED';
export interface NewHouseCollectorResult {
  status: NewHouseCollectorStatus;
  items: Raw591NewHouseListing[];
  fetchedPages: number;
  warnings: string[];
  errors: string[];
}
