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

const POST_RELATED_HEADING_BLOCK_EXEMPTION: TExemptField[] = [
  {
    name: 'headingBlock',
    reason:
      "module_postRelated's headingBlock is authored by hand in Studio — this shared document was created with no sectionHeader to rename and no migration ever sets headingBlock for it",
  },
];

const NEWSLETTER_HEADING_BLOCK_EXEMPTION: TExemptField[] = [
  {
    name: 'headingBlock',
    reason:
      'headingBlock became required after this migration was already applied — it still writes the pre-rename sectionHeader field — and the later rename-section-header-to-heading-block migration converts it to headingBlock',
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
      POST_RELATED_HEADING_BLOCK_EXEMPTION,
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
      NEWSLETTER_HEADING_BLOCK_EXEMPTION,
    );
  });

  it('is the Compact variant', () => {
    expect(sharedNewsletterModule.variant).toBe(NEWSLETTER_VARIANT.COMPACT);
  });
});
