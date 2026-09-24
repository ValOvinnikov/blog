import type { MigrationContext } from 'sanity/migrate';

const PRECONDITION_QUERY = `{
  "target": *[_id == $personId][0]{ name },
  "refCount": count(*[references($id)])
}`;

type TPreconditionResult = {
  target: { name?: string } | null;
  refCount: number;
};

export const assertBlogAuthorDeletable = async (
  context: MigrationContext,
  blogAuthorId: string,
  personId: string,
): Promise<void> => {
  const { target, refCount } = await context.client.fetch<TPreconditionResult>(
    PRECONDITION_QUERY,
    { personId, id: blogAuthorId },
  );

  if (!target) {
    throw new Error(
      `Cannot delete blog_author "${blogAuthorId}": its person counterpart "${personId}" does not exist.`,
    );
  }

  if (!target.name) {
    throw new Error(
      `Cannot delete blog_author "${blogAuthorId}": person "${personId}" has no name set.`,
    );
  }

  if (refCount !== 0) {
    throw new Error(
      `Cannot delete blog_author "${blogAuthorId}": still referenced by ${refCount} document(s).`,
    );
  }
};
