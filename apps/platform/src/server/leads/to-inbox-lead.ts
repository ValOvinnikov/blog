import 'server-only';

import {
  isLocaleIsoCode,
  type TLocaleIsoCode,
  type TMaybeNull,
} from '@shinefold/config';
import type { TListedLead } from '@shinefold/db/queries/leads';
import { isNull } from '@shinefold/utils/primitives';

export type TInboxLead = Pick<
  TListedLead,
  'id' | 'name' | 'email' | 'message' | 'sourcePath' | 'createdAt'
> & {
  sourceDocumentId: TMaybeNull<string>;
  sourceLocale: TMaybeNull<TLocaleIsoCode>;
  isRead: boolean;
};

export const toInboxLead = ({
  id,
  name,
  email,
  message,
  sourcePath,
  sourceDocumentId,
  sourceLocale,
  readAt,
  createdAt,
}: TListedLead): TInboxLead => ({
  id,
  name,
  email,
  message,
  sourcePath,
  sourceDocumentId,
  sourceLocale:
    sourceLocale && isLocaleIsoCode(sourceLocale) ? sourceLocale : null,
  isRead: !isNull(readAt),
  createdAt,
});
