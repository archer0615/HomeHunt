export interface ListingPersonalState {
  listingId: string;
  favorite: boolean;
  excluded: boolean;
  visited: boolean;
  tags?: string[];
  updatedAt: string;
}
export const emptyPersonalState = (listingId: string): ListingPersonalState => ({
  listingId,
  favorite: false,
  excluded: false,
  visited: false,
  updatedAt: new Date(0).toISOString(),
});
