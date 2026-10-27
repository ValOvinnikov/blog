import {
  BRAND_TAGLINE_SEPARATOR_CHARS,
  type TMaybeUndefined,
  type TNullable,
} from '@blog/config';
import type { brandTaglineFragment } from '@blog/service/shared/fragments/brand-tagline/brand-tagline';
import type { InferFragmentType } from 'groqd';

export type TRawBrandTagline = InferFragmentType<typeof brandTaglineFragment>;

export function toBrandTagline(
  raw: TNullable<TRawBrandTagline>,
): TMaybeUndefined<string> {
  const items = (raw?.items ?? []).flatMap((item) =>
    item.text ? [item.text] : [],
  );

  if (!raw || !items.length) return undefined;

  return items.join(` ${BRAND_TAGLINE_SEPARATOR_CHARS[raw.separator]} `);
}
