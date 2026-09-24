import type { LinkRef } from '@blog/config';
import { q } from '@blog/service/sanity/query';
import { linkDocumentFragment } from '@blog/service/shared/fragments/link/link-document';

export const portableTextMarkDefFragment = q
  .fragment<{ _key: string } & LinkRef>()
  .project((sub) => ({
    _key: true,
    _type: true,
    // Nullable despite `linkRef.link` being required at authoring time: the referenced link document can be deleted afterward, leaving a dangling reference that the transformer degrades to plain text.
    link: sub
      .field('link')
      .deref()
      .project(linkDocumentFragment)
      .nullable(true),
  }));
