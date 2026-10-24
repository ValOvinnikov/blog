import 'server-only';

import {
  isLocaleIsoCode,
  type TLocaleIsoCode,
  type TMaybeNull,
} from '@blog/config';
import type { TListedLead } from '@blog/db/queries/leads';
import { isNull } from '@blog/utils/primitives';

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
