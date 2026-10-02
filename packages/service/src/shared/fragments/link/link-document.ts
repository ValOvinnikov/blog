import { q } from '@blog/service/sanity/query';
import { buildLocalizedValueExpression } from '@blog/service/shared/localization/localized-value';
import { buildTranslatedReferenceExpression } from '@blog/service/shared/localization/translated-reference';

type TLinkTarget = { _type: string; slug: string | null };

// Projected unconditionally — groqd's `sub.conditional()` union silently drops the matching branch's own field at parse time.
export const linkDocumentFragment = q
  .fragmentForType<'link'>()
  .project((sub) => ({
    label: sub.raw<string | null>(buildLocalizedValueExpression('label')),
    linkType: sub.field('linkType').notNull(),
    openInNewTab: sub.field('openInNewTab').nullable(true),
    internalReference: sub.raw<TLinkTarget | null>(
      `${buildTranslatedReferenceExpression('internalReference')}{_type, "slug": slug.current}`,
    ),
    url: sub.raw<string | null>(buildLocalizedValueExpression('url')),
  }));
