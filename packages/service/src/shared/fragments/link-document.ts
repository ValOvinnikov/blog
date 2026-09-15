import { LINK_TYPE } from '@blog/config';
import { q } from '@blog/service/sanity/query';

/** Projects a `link` document down to the fields `toLinkDocument` needs to resolve it. */
export const linkDocumentFragment = q
  .fragmentForType<'link'>()
  .project((sub) => ({
    label: sub.field('label').notNull(),
    linkType: sub.field('linkType').notNull(),
    openInNewTab: sub.field('openInNewTab').nullable(true),
    ...sub.conditional(
      {
        [`linkType == "${LINK_TYPE.INTERNAL}"`]: sub.project((s) => ({
          internalReference: s
            .field('internalReference')
            .deref()
            .project((ref) => ({
              _type: true,
              slug: ref.raw<string | null>('slug.current'),
            }))
            .nullable(true),
        })),
        [`linkType == "${LINK_TYPE.EXTERNAL}"`]: sub.project((s) => ({
          url: s.field('url').nullable(true),
        })),
      },
      { isExhaustive: true },
    ),
  }));
