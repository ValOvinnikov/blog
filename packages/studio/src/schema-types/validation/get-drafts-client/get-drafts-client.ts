import type { SanityClient, ValidationContext } from 'sanity';

const DRAFTS_CLIENT_API_VERSION = '2024-01-01';

/**
 * Custom schema validators (`rule.custom(...)`) dereference sibling/referenced
 * documents through the drafts perspective because a referenced module or
 * document can still be an unpublished draft while the containing document
 * is being edited.
 */
export const getDraftsClient = (context: ValidationContext) =>
  context
    .getClient({ apiVersion: DRAFTS_CLIENT_API_VERSION })
    .withConfig({ perspective: 'drafts' });

export const getPublishedClient = (context: ValidationContext) =>
  context
    .getClient({ apiVersion: DRAFTS_CLIENT_API_VERSION })
    .withConfig({ perspective: 'published' });

/** A rejected fetch is a network failure, not an invalid document, so a validator resolves to `fallback` rather than blocking publish. */
export const fetchFailSafe = async <T>(
  client: Pick<SanityClient, 'fetch'>,
  query: string,
  params: Record<string, unknown>,
  fallback: T,
): Promise<T> => {
  try {
    return await client.fetch<T>(query, params);
  } catch {
    return fallback;
  }
};
