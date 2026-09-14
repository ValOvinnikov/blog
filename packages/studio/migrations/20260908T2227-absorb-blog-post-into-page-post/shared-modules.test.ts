import { NEWSLETTER_VARIANT } from '@blog/config/constants';
import { newsletterSchema } from '@blog/studio/schema-types/modules/newsletter/newsletter';
import { postRelatedSchema } from '@blog/studio/schema-types/modules/post-related/post-related';
import {
  assertSatisfiesRequiredFields,
  type TExemptField,
} from '@blog/studio/testing/assert-satisfies-required-fields';

import {
  SHARED_MODULE_IDS,
  sharedNewsletterModule,
  sharedPostRelatedModule,
} from './shared-modules';

const HEADING_BLOCK_EXEMPTION: TExemptField[] = [
  {
    name: 'headingBlock',
    reason:
      'headingBlock became required after this migration was already applied; the later backfill-missing-heading-block-heading migration closes the gap on existing documents',
  },
];

describe('sharedPostRelatedModule', () => {
  it('uses the fixed POST_RELATED id', () => {
    expect(sharedPostRelatedModule._id).toBe(SHARED_MODULE_IDS.POST_RELATED);
  });

  it('satisfies every field module_postRelated requires', () => {
    assertSatisfiesRequiredFields(
      postRelatedSchema,
      sharedPostRelatedModule,
      HEADING_BLOCK_EXEMPTION,
    );
  });
});

describe('sharedNewsletterModule', () => {
  it('uses the fixed NEWSLETTER id', () => {
    expect(sharedNewsletterModule._id).toBe(SHARED_MODULE_IDS.NEWSLETTER);
  });

  it('satisfies every field module_newsletter requires', () => {
    assertSatisfiesRequiredFields(
      newsletterSchema,
      sharedNewsletterModule,
      HEADING_BLOCK_EXEMPTION,
    );
  });

  it('is the Compact variant', () => {
    expect(sharedNewsletterModule.variant).toBe(NEWSLETTER_VARIANT.COMPACT);
  });
});
