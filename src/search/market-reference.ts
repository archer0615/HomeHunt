import type { Listing, Transaction } from '../../shared/domain';

const FIVE_YEARS_MS = 5 * 365.25 * 24 * 60 * 60 * 1000;

export function findComparableTransactions(
  listing: Listing,
  transactions: Transaction[],
  now = Date.now(),
): Transaction[] {
  if (!listing.city || !listing.district || listing.buildingArea === undefined) return [];
  const expectedType = listing.listingType === 'PRESALE' ? 'PRESALE' : 'USED';
  return transactions
    .filter((transaction) => {
      if (
        transaction.city !== listing.city ||
        transaction.district !== listing.district ||
        transaction.transactionType !== expectedType ||
        transaction.transactionDate === undefined ||
        transaction.buildingArea === undefined
      )
        return false;
      const date = Date.parse(transaction.transactionDate);
      if (!Number.isFinite(date) || date > now || now - date > FIVE_YEARS_MS) return false;
      const areaRatio = transaction.buildingArea / listing.buildingArea!;
      return areaRatio >= 0.8 && areaRatio <= 1.2;
    })
    .sort((left, right) => Date.parse(right.transactionDate!) - Date.parse(left.transactionDate!));
}

export function compareIdsFromUrl(value: string | null): string[] {
  return [
    ...new Set(
      (value ?? '')
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean),
    ),
  ].slice(0, 4);
}

export function addCompareId(ids: string[], id: string): string[] {
  return ids.includes(id) || ids.length >= 4 ? ids : [...ids, id];
}
