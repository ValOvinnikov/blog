import { pageHref, type TMaybeUndefined } from '@blog/config';
import type { InferResultType } from 'groqd';

import type { draftPagePathQuery } from './query';
import type { TDraftPagePath } from './types';

export type TRawDraftPagePath = NonNullable<
  InferResultType<typeof draftPagePathQuery>
>;

export function toDraftPagePath({
  _type,
  path,
  language,
}: TRawDraftPagePath): TMaybeUndefined<TDraftPagePath> {
  const href = pageHref(_type, path);
  return href ? { href, locale: language } : undefined;
}
