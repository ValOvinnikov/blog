import type { CtaButton } from '@shinefold/config';
import { q } from '@shinefold/service/sanity/query/query';
import { ctaButtonFragment } from '@shinefold/service/shared/fragments/cta/cta-button';

export const ctaButtonsFragment = q
  .fragment<{ ctaButtons?: Array<{ _key: string } & CtaButton> }>()
  .project((sub) => ({
    ctaButtons: sub
      .field('ctaButtons[]')
      .project(ctaButtonFragment)
      .nullable(true),
  }));
