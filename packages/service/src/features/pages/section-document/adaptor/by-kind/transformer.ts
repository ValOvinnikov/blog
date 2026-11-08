import { pageHref, type TMaybeUndefined } from '@blog/config';
import type { InferResultType } from 'groqd';

import type { sectionDocumentByKindQuery } from './query';
import type { TSectionDocumentLink } from './types';

export type TRawSectionDocumentByKind = NonNullable<
  InferResultType<typeof sectionDocumentByKindQuery>
>;

export function toSectionDocumentLink(
  raw: TRawSectionDocumentByKind,
): TMaybeUndefined<TSectionDocumentLink> {
  const href = pageHref(raw._type, raw.slug);

  return href ? { href } : undefined;
}
