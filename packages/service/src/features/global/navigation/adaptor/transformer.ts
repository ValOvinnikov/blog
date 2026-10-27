import type { TMaybeUndefined } from '@blog/config';
import { toBrandTagline } from '@blog/service/shared/transformers/brand-tagline/to-brand-tagline';
import { toLinkDocument } from '@blog/service/shared/transformers/link/to-link-document';
import { toLinkDocuments } from '@blog/service/shared/transformers/link/to-link-documents';
import type { InferResultType } from 'groqd';

import type { navigationQuery } from './query';
import type { TNavigation, TNavigationItem } from './types';

export type TRawNavigation = NonNullable<
  InferResultType<typeof navigationQuery>
>;

type TRawNavigationItem = NonNullable<TRawNavigation['items']>[number];

function toNavigationItem(
  raw: TRawNavigationItem,
): TMaybeUndefined<TNavigationItem> {
  const link = toLinkDocument(raw.link);

  if (!link || !('subItems' in raw)) return link;

  const subItems = toLinkDocuments(raw.subItems.map((subItem) => subItem.link));

  return subItems.length ? { ...link, subItems: [link, ...subItems] } : link;
}

export function toNavigation(raw: TRawNavigation): TNavigation {
  return {
    items: (raw.items ?? []).flatMap((item) => toNavigationItem(item) ?? []),
    tagline: toBrandTagline(raw.tagline),
    showLanguageSwitcher: raw.showLanguageSwitcher ?? undefined,
  };
}
