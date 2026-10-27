import { newsletterSchema } from '@blog/studio/schema-types/modules/newsletter/newsletter';
import { postRelatedSchema } from '@blog/studio/schema-types/modules/post-related/post-related';
import {
  assertSatisfiesRequiredFields,
  type TExemptField,
} from '@blog/studio/testing/assert-satisfies-required-fields';

import {
  sharedNewsletterModule,
  sharedPostRelatedModule,
} from './shared-modules';

const POST_RELATED_HEADING_BLOCK_EXEMPTION: TExemptField[] = [
  {
    name: 'headingBlock',
    reason:
      'sharedPostRelatedModule carries only _id, _type, title, brandVariant and limit — no sectionHeader or headingBlock of any kind',
  },
];

const NEWSLETTER_HEADING_BLOCK_EXEMPTION: TExemptField[] = [
  {
    name: 'headingBlock',
    reason: 'sharedNewsletterModule sets sectionHeader, not headingBlock',
  },
];

describe('shared page_post modules', () => {
  it('seeds a post related module satisfying every required field', () => {
    assertSatisfiesRequiredFields(
      postRelatedSchema,
      sharedPostRelatedModule,
      POST_RELATED_HEADING_BLOCK_EXEMPTION,
    );
  });

  it('seeds a newsletter module satisfying every required field', () => {
    assertSatisfiesRequiredFields(
      newsletterSchema,
      sharedNewsletterModule,
      NEWSLETTER_HEADING_BLOCK_EXEMPTION,
    );
  });
});
