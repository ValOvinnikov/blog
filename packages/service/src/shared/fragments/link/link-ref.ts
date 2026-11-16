import type { LinkRef } from '@shinefold/config';
import { q } from '@shinefold/service/sanity/query/query';
import { linkDocumentFragment } from '@shinefold/service/shared/fragments/link/link-document';
import type { TLocaleQueryParams } from '@shinefold/service/shared/localization/locale-query-params/locale-query-params';

export const linkRefFragment = q
  .parameters<TLocaleQueryParams>()
  .fragment<LinkRef>()
  .project((linkRef) => ({
    link: linkRef
      .field('link')
      .deref()
      .project(linkDocumentFragment)
      .nullable(true),
  }));
