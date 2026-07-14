import type {
  AllSanitySchemaTypes,
  internalGroqTypeReferenceTo,
} from '@blog/config';
import { createGroqBuilder, makeSafeQueryRunner } from 'groqd';

import { getClient } from './client';

type TSchemaConfig = {
  schemaTypes: AllSanitySchemaTypes;
  referenceSymbol: typeof internalGroqTypeReferenceTo;
};

export const q = createGroqBuilder<TSchemaConfig>();

/** Shared `.parameters<T>()` shape for the slug-lookup queries (post, category, author, generic page). */
export type TSlugParams = { slug: string };

type TNextFetchOptions = {
  next?: { revalidate?: number | false; tags?: string[] };
};

export const runQuery = makeSafeQueryRunner<TNextFetchOptions>(
  (query, { parameters, next }) =>
    getClient().fetch(query, parameters ?? {}, next ? { next } : undefined),
);

export const isr = (tag: string | string[]): TNextFetchOptions => ({
  next: { revalidate: 3600, tags: Array.isArray(tag) ? tag : [tag] },
});
