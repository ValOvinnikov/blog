import { NEWSLETTER_VARIANT } from '@blog/config/constants';
import { newsletterSchema } from '@blog/studio/schema-types/modules/newsletter/newsletter';
import { postRelatedSchema } from '@blog/studio/schema-types/modules/post-related/post-related';
import { assertSatisfiesRequiredFields } from '@blog/studio/testing/assert-satisfies-required-fields';

import {
  SHARED_MODULE_IDS,
  sharedNewsletterModule,
  sharedPostRelatedModule,
} from './shared-modules';

describe('sharedPostRelatedModule', () => {
  it('uses the fixed POST_RELATED id', () => {
    expect(sharedPostRelatedModule._id).toBe(SHARED_MODULE_IDS.POST_RELATED);
  });

  it('satisfies every field module_postRelated requires', () => {
    assertSatisfiesRequiredFields(postRelatedSchema, sharedPostRelatedModule);
  });
});

describe('sharedNewsletterModule', () => {
  it('uses the fixed NEWSLETTER id', () => {
    expect(sharedNewsletterModule._id).toBe(SHARED_MODULE_IDS.NEWSLETTER);
  });

  it('satisfies every field module_newsletter requires', () => {
    assertSatisfiesRequiredFields(newsletterSchema, sharedNewsletterModule);
  });

  it('is the Compact variant', () => {
    expect(sharedNewsletterModule.variant).toBe(NEWSLETTER_VARIANT.COMPACT);
  });
});
