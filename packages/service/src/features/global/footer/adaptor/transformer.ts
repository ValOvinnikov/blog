import { toLinkDocument } from '@blog/service/shared/transformers/to-link-document';
import type { InferResultType } from 'groqd';

import type { footerQuery } from './query';
import type { TFooter, TFooterSocialLink } from './types';

export type TRawFooter = NonNullable<InferResultType<typeof footerQuery>>;
type TRawFooterSocialLink = NonNullable<TRawFooter['social']>[number];

function toFooterSocialLink(
  raw: TRawFooterSocialLink,
): TFooterSocialLink | undefined {
  const link = toLinkDocument(raw.link);
  if (!link) return undefined;

  return { platform: raw.platform, link };
}

export function toFooter(raw: TRawFooter): TFooter {
  return {
    social: (raw.social ?? []).flatMap(
      (item) => toFooterSocialLink(item) ?? [],
    ),
  };
}
