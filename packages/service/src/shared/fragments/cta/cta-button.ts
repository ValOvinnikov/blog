import { q } from '@shinefold/service/sanity/query/query';
import { linkDocumentFragment } from '@shinefold/service/shared/fragments/link/link-document';

export const ctaButtonFragment = q
  .fragmentForType<'ctaButton'>()
  .project((sub) => ({
    variant: sub.field('variant').notNull(),
    appearance: sub.field('appearance').nullable(true),
    link: sub.field('link').deref().project(linkDocumentFragment).notNull(),
  }));

export const ctaSecondaryButtonFragment = q
  .fragmentForType<'ctaSecondaryButton'>()
  .project((sub) => ({
    variant: sub.field('variant').notNull(),
    appearance: sub.field('appearance').nullable(true),
    link: sub
      .field('link')
      .deref()
      .project(linkDocumentFragment)
      .nullable(true),
  }));
