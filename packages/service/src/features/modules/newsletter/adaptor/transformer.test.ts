import { BRAND_VARIANT } from '@blog/config';
import { makeRawNewsletterModule } from '@blog/service/testing/modules/fixtures';

import { toNewsletterModule } from './transformer';

describe('toNewsletterModule', () => {
  it('maps brandVariant straight through', () => {
    const raw = makeRawNewsletterModule({
      brandVariant: BRAND_VARIANT.SECONDARY,
    });

    const newsletter = toNewsletterModule(raw);

    expect(newsletter.brandVariant).toBe(BRAND_VARIANT.SECONDARY);
  });

  it('maps heading and description', () => {
    const raw = makeRawNewsletterModule();

    const newsletter = toNewsletterModule(raw);

    expect(newsletter.heading).toBe('Stay in the loop');
    expect(newsletter.description).toBe('Get new posts in your inbox.');
  });

  it('leaves description undefined when not set (no faked default)', () => {
    const raw = makeRawNewsletterModule({ description: null });

    const newsletter = toNewsletterModule(raw);

    expect(newsletter.description).toBeUndefined();
  });
});
