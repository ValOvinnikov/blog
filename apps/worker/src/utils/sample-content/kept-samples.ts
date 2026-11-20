import type { SanityDocument } from '@sanity/client';
import type { TLocaleIsoCode } from '@shinefold/config/constants';
import type { TMaybeUndefined } from '@shinefold/config/types';
import { isString } from '@shinefold/utils/primitives';
import { z } from 'zod';

export type TKeptSample = { id: string; type: string; title?: string };

const titleSchema = z.union([
  z.string(),
  z.array(z.object({ language: z.string(), value: z.string() })),
]);

function readTitle(
  title: unknown,
  locale: TLocaleIsoCode,
): TMaybeUndefined<string> {
  const parsed = titleSchema.safeParse(title);
  if (!parsed.success) return undefined;
  const { data } = parsed;

  return isString(data)
    ? data
    : data.find(({ language }) => language === locale)?.value;
}

export function listKeptSamples(
  starterDocuments: SanityDocument[],
  keptIds: Set<string>,
  locale: TLocaleIsoCode,
): TKeptSample[] {
  return starterDocuments
    .filter(({ _id }) => keptIds.has(_id))
    .sort((a, b) => a._id.localeCompare(b._id))
    .map(({ _id, _type, title, name }) => {
      const resolvedTitle = readTitle(title ?? name, locale);

      return {
        id: _id,
        type: _type,
        ...(resolvedTitle && { title: resolvedTitle }),
      };
    });
}
