export interface ListingPersonalState {
  listingId: string;
  favorite: boolean;
  excluded: boolean;
  visited: boolean;
  updatedAt: string;
}
export const emptyPersonalState = (listingId: string): ListingPersonalState => ({
  listingId,
  favorite: false,
  excluded: false,
  visited: false,
  updatedAt: new Date(0).toISOString(),
});
