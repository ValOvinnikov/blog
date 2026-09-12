import type { MigrationContext } from 'sanity/migrate';

const PRECONDITION_QUERY = `{
  "target": *[_id == $postIndexId][0]{ modules },
  "refCount": count(*[references($id)])
}`;

type TPreconditionResult = {
  target: { modules?: unknown } | null;
  refCount: number;
};

const hasModules = (modules: unknown): boolean =>
  Array.isArray(modules) && modules.length > 0;

/**
 * Verifies a `page_blog` is safe to delete: its `page_postIndex` counterpart
 * exists with a non-empty `modules` array, and nothing in the dataset still
 * references it. Throws rather than returning a boolean — a precondition
 * failure aborts the whole migration run instead of silently skipping the
 * document.
 */
export const assertPageBlogDeletable = async (
  context: MigrationContext,
  pageBlogId: string,
  postIndexId: string,
): Promise<void> => {
  const { target, refCount } = await context.client.fetch<TPreconditionResult>(
    PRECONDITION_QUERY,
    { postIndexId, id: pageBlogId },
  );

  if (!target) {
    throw new Error(
      `Cannot delete page_blog "${pageBlogId}": its page_postIndex counterpart "${postIndexId}" does not exist.`,
    );
  }

  if (!hasModules(target.modules)) {
    throw new Error(
      `Cannot delete page_blog "${pageBlogId}": page_postIndex "${postIndexId}" has no modules set.`,
    );
  }

  if (refCount !== 0) {
    throw new Error(
      `Cannot delete page_blog "${pageBlogId}": still referenced by ${refCount} document(s).`,
    );
  }
};
