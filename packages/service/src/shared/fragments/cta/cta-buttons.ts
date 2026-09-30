import type { CtaButton } from '@blog/config';
import { q } from '@blog/service/sanity/query';
import { ctaButtonFragment } from '@blog/service/shared/fragments/cta/cta-button';

export const ctaButtonsFragment = q
  .fragment<{ ctaButtons?: Array<{ _key: string } & CtaButton> }>()
  .project((sub) => ({
    ctaButtons: sub
      .field('ctaButtons[]')
      .project(ctaButtonFragment)
      .nullable(true),
  }));
