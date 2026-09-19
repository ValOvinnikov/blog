import type { MigrationContext } from 'sanity/migrate';

type TEntityDoc = { title?: string };

export const resolveEntityTitle = async (
  context: MigrationContext,
  ref: string | undefined,
): Promise<string | undefined> => {
  if (!ref) return undefined;

  const entity = await context.client.fetch<TEntityDoc | null>(
    '*[_id == $ref][0]{ title }',
    { ref },
  );

  return entity?.title?.trim() || undefined;
};
