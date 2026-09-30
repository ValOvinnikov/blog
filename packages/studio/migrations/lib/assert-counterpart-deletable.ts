import type { MigrationContext } from 'sanity/migrate';

type TAssertCounterpartDeletableOptions = {
  sourceType: string;
  counterpartType: string;
  counterpartIdParam: string;
  field: string;
  hasValue: (value: unknown) => boolean;
};

type TPreconditionResult = {
  target: Record<string, unknown> | null;
  refCount: number;
};

/**
 * Verifies a source document is safe to delete: its replacement counterpart
 * exists with `field` set, and nothing in the dataset still references the
 * source. Throws rather than returning a boolean — a precondition failure
 * aborts the whole migration run instead of silently skipping the document.
 */
export const assertCounterpartDeletable = async (
  context: MigrationContext,
  sourceId: string,
  counterpartId: string,
  {
    sourceType,
    counterpartType,
    counterpartIdParam,
    field,
    hasValue,
  }: TAssertCounterpartDeletableOptions,
): Promise<void> => {
  const { target, refCount } = await context.client.fetch<TPreconditionResult>(
    `{
      "target": *[_id == $${counterpartIdParam}][0]{ ${field} },
      "refCount": count(*[references($id)])
    }`,
    { [counterpartIdParam]: counterpartId, id: sourceId },
  );

  if (!target) {
    throw new Error(
      `Cannot delete ${sourceType} "${sourceId}": its ${counterpartType} counterpart "${counterpartId}" does not exist.`,
    );
  }

  if (!hasValue(target[field])) {
    throw new Error(
      `Cannot delete ${sourceType} "${sourceId}": ${counterpartType} "${counterpartId}" has no ${field} set.`,
    );
  }

  if (refCount !== 0) {
    throw new Error(
      `Cannot delete ${sourceType} "${sourceId}": still referenced by ${refCount} document(s).`,
    );
  }
};
