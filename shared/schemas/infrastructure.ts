import { z } from 'zod';
import { isoDateTime } from './common';
import { crawlRunStatuses, sourceExecutionModes, sourceTypes } from '../domain/enums';

export const sourceSchema = z.object({ id: z.string().min(1), name: z.string().min(1), sourceType: z.enum(sourceTypes), baseUrl: z.string().url().optional(), enabled: z.boolean(), executionMode: z.enum(sourceExecutionModes), crawlIntervalMinutes: z.number().finite().nonnegative().int().optional(), lastSuccessAt: isoDateTime.optional(), lastFailureAt: isoDateTime.optional(), consecutiveFailures: z.number().int().nonnegative(), createdAt: isoDateTime, updatedAt: isoDateTime });
export const crawlRunSchema = z.object({ id: z.string().min(1), sourceId: z.string().min(1), startedAt: isoDateTime, finishedAt: isoDateTime.optional(), status: z.enum(crawlRunStatuses), listingCount: z.number().int().nonnegative().optional(), errorMessage: z.string().optional() });
export const userStateSchema = z.object({ listingId: z.string().min(1), favorite: z.boolean(), excluded: z.boolean(), visited: z.boolean(), notes: z.string().optional(), rating: z.number().finite().optional(), createdAt: isoDateTime, updatedAt: isoDateTime });
