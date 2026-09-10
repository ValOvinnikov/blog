import type { MigrationContext } from 'sanity/migrate';

const PRECONDITION_QUERY = `{
  "target": *[_id == $pagePostId][0]{ content },
  "refCount": count(*[references($id)])
}`;

type TPreconditionResult = {
  target: { content?: unknown } | null;
  refCount: number;
};

const hasContent = (content: unknown): boolean =>
  Array.isArray(content) ? content.length > 0 : Boolean(content);

/**
 * Verifies a `blog_post` is safe to delete: its `page_post` counterpart
 * exists with `content` set, and nothing in the dataset still references it.
 * Throws rather than returning a boolean — a precondition failure aborts the
 * whole migration run instead of silently skipping the document.
 */
export const assertBlogPostDeletable = async (
  context: MigrationContext,
  blogPostId: string,
  pagePostId: string,
): Promise<void> => {
  const { target, refCount } = await context.client.fetch<TPreconditionResult>(
    PRECONDITION_QUERY,
    { pagePostId, id: blogPostId },
  );

  if (!target) {
    throw new Error(
      `Cannot delete blog_post "${blogPostId}": its page_post counterpart "${pagePostId}" does not exist.`,
    );
  }

  if (!hasContent(target.content)) {
    throw new Error(
      `Cannot delete blog_post "${blogPostId}": page_post "${pagePostId}" has no content set.`,
    );
  }

  if (refCount !== 0) {
    throw new Error(
      `Cannot delete blog_post "${blogPostId}": still referenced by ${refCount} document(s).`,
    );
  }
};
