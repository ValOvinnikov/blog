import type { LinkRef } from '@blog/config';
import { q } from '@blog/service/sanity/query';
import { linkDocumentFragment } from '@blog/service/shared/fragments/link-document';

export const portableTextMarkDefFragment = q
  .fragment<{ _key: string } & LinkRef>()
  .project((sub) => ({
    _key: true,
    _type: true,
    link: sub
      .field('link')
      .deref()
      .project(linkDocumentFragment)
      .nullable(true),
  }));
