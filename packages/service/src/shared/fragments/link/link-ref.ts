import type { LinkRef } from '@blog/config';
import { q } from '@blog/service/sanity/query/query';
import { linkDocumentFragment } from '@blog/service/shared/fragments/link/link-document';
import type { TLocaleQueryParams } from '@blog/service/shared/localization/locale-query-params/locale-query-params';

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
