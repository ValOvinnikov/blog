import type { CookiePreferencesLink, LinkRef } from '@shinefold/config';
import { q } from '@shinefold/service/sanity/query/query';
import { linkDocumentFragment } from '@shinefold/service/shared/fragments/link/link-document';

export const portableTextMarkDefFragment = q
  .fragment<{ _key: string } & (LinkRef | CookiePreferencesLink)>()
  .project((sub) => ({
    _key: true,
    _type: true,
    ...sub.conditionalByType({
      linkRef: (linkRefSub) => ({
        // Nullable despite `linkRef.link` being required at authoring time: the referenced link document can be deleted afterward, leaving a dangling reference that the transformer degrades to plain text.
        link: linkRefSub
          .field('link')
          .deref()
          .project(linkDocumentFragment)
          .nullable(true),
      }),
    }),
  }));
