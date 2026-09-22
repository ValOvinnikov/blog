import { q } from '@blog/service/sanity/query';
import { linkDocumentFragment } from '@blog/service/shared/fragments/link/link-document';

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
