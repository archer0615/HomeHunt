export interface PresaleProject {
  id: string;
  sourceId: 'moi-presale-registry';
  projectName?: string;
  city: string;
  district?: string;
  address?: string;
  builder?: string;
  householdCount?: number;
  useZoning?: string;
  mainUse?: string;
  mainMaterial?: string;
  declaredDate?: string;
  sellingPeriod?: string;
  buildingPermitDate?: string;
  buildingPermitNumber?: string;
  firstRegistrationDate?: string;
  sourceUrl: string;
  updatedAt: string;
}
