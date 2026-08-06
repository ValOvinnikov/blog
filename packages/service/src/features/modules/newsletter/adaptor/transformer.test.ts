import { makeRawNewsletterModule } from '@blog/service/testing/modules/fixtures';

import { toNewsletterModule } from './transformer';

describe('toNewsletterModule', () => {
  it('maps heading and description', () => {
    const raw = makeRawNewsletterModule();

    const newsletter = toNewsletterModule(raw);

    expect(newsletter.heading).toBe('Stay in the loop');
    expect(newsletter.description).toBe('Get new posts in your inbox.');
  });

  it('leaves heading and description undefined when not set (no faked default)', () => {
    const raw = makeRawNewsletterModule({ heading: null, description: null });

    const newsletter = toNewsletterModule(raw);

    expect(newsletter.heading).toBeUndefined();
    expect(newsletter.description).toBeUndefined();
  });
});
