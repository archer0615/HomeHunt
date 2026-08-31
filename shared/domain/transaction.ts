import type { BuildingType, ParkingType, TransactionType } from './enums';

export interface Transaction {
  id: string;
  sourceId: string;
  transactionType: TransactionType;
  city?: string;
  district?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  transactionDate?: string;
  totalPrice?: number;
  unitPrice?: number;
  buildingArea?: number;
  mainArea?: number;
  auxiliaryArea?: number;
  landArea?: number;
  rooms?: number;
  halls?: number;
  bathrooms?: number;
  floor?: number;
  totalFloors?: number;
  buildingType?: BuildingType;
  completionDate?: string;
  buildingAge?: number;
  hasElevator?: boolean;
  hasParking?: boolean;
  parkingType?: ParkingType;
  parkingArea?: number;
  parkingPrice?: number;
  rawSourceId?: string;
  createdAt: string;
}
