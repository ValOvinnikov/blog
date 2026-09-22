import type { ValidationContext } from 'sanity';

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

/**
 * A rejected `fetch` means the network failed, not that the document is
 * invalid — every `getDraftsClient`-based validator routes its fetch through
 * here so a transient outage resolves to `fallback` instead of rejecting the
 * validator and blocking publish.
 */
export const fetchDraftsFailSafe = async <T>(
  context: ValidationContext,
  query: string,
  params: Record<string, unknown>,
  fallback: T,
): Promise<T> => {
  try {
    return await getDraftsClient(context).fetch<T>(query, params);
  } catch {
    return fallback;
  }
};
