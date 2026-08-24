import { z } from 'zod';

export const publicationSourceStatusSchema = z.object({
  sourceId: z.string().min(1),
  status: z.enum(['SUCCESS', 'PARTIAL', 'FAILED', 'UNKNOWN']),
  lastSuccessfulRunAt: z.string().datetime({ offset: true }).optional(),
  lastAttemptAt: z.string().datetime({ offset: true }).optional(),
  itemCount: z.number().int().nonnegative(),
});
export const publicationMetadataSchema = z.object({
  schemaVersion: z.number().int().positive(),
  appDataVersion: z.string().min(1),
  generatedAt: z.string().datetime({ offset: true }),
  counts: z.object({
    listings: z.number().int().nonnegative(),
    priceHistory: z.number().int().nonnegative(),
    listingEvents: z.number().int().nonnegative(),
    transactions: z.number().int().nonnegative(),
  }),
  sources: z.array(publicationSourceStatusSchema),
});
export type PublicationMetadata = z.infer<typeof publicationMetadataSchema>;
