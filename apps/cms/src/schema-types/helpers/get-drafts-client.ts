import type { ValidationContext } from 'sanity';

const DRAFTS_CLIENT_API_VERSION = '2024-01-01';

/**
 * Client-side custom validators dereference sibling/referenced documents
 * through the drafts perspective because a referenced module or document can
 * still be an unpublished draft while the containing document is being
 * edited.
 */
export const getDraftsClient = (context: ValidationContext) =>
  context
    .getClient({ apiVersion: DRAFTS_CLIENT_API_VERSION })
    .withConfig({ perspective: 'drafts' });
