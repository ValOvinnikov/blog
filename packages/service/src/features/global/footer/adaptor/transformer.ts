import { FOOTER_FINE_PRINT_KIND, type TMaybeUndefined } from '@blog/config';
import { toLinkDocument } from '@blog/service/shared/transformers/link/to-link-document';
import { toLinkDocuments } from '@blog/service/shared/transformers/link/to-link-documents';
import { toSocialProfiles } from '@blog/service/shared/transformers/social-profile/to-social-profiles';
import type { InferResultType } from 'groqd';

import type { footerQuery } from './query';
import type { TFooter, TFooterFinePrintItem, TFooterLinkGroup } from './types';

export type TRawFooter = NonNullable<InferResultType<typeof footerQuery>>;

type TRawFooterLinkGroup = NonNullable<TRawFooter['groups']>[number];

type TRawFooterFinePrintItem = NonNullable<TRawFooter['finePrint']>[number];

function toFooterLinkGroup(
  raw: TRawFooterLinkGroup,
): TMaybeUndefined<TFooterLinkGroup> {
  const links = toLinkDocuments((raw.links ?? []).map(({ link }) => link));

  return links.length
    ? { heading: raw.heading ?? undefined, links }
    : undefined;
}

function toFooterFinePrintItem(
  raw: TRawFooterFinePrintItem,
): TMaybeUndefined<TFooterFinePrintItem> {
  if (raw._type === 'cookieSettingsItem') {
    return { kind: FOOTER_FINE_PRINT_KIND.COOKIE_SETTINGS };
  }

  const link = toLinkDocument(raw.link);

  return link && { kind: FOOTER_FINE_PRINT_KIND.LINK, link };
}

export function toFooter(raw: TRawFooter): TFooter {
  return {
    social: toSocialProfiles(raw.social),
    groups: (raw.groups ?? []).flatMap(
      (group) => toFooterLinkGroup(group) ?? [],
    ),
    about: raw.about ?? undefined,
    address: raw.address ?? undefined,
    finePrint: (raw.finePrint ?? []).flatMap(
      (item) => toFooterFinePrintItem(item) ?? [],
    ),
    showLanguageSwitcher: raw.showLanguageSwitcher ?? undefined,
    showRssFeed: raw.showRssFeed ?? true,
  };
}
