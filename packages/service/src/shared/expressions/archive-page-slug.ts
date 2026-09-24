import { z } from 'zod';

export function buildArchivePageSlugExpression(
  archivePageType: string,
  referenceField: string,
): string {
  return `coalesce(*[_type == "${archivePageType}" && ${referenceField}._ref == ^._id][0].slug.current, slug.current)`;
}

export const archivePageSlugParser = z.string();
