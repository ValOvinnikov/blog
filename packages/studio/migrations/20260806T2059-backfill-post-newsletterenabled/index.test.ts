import { at, set } from 'sanity/migrate';

import { backfillNewsletterEnabled } from './index';

describe(backfillNewsletterEnabled, () => {
  it('enables the newsletter on a post that never had the field', () => {
    const result = backfillNewsletterEnabled({});

    expect(result).toEqual([at('newsletterEnabled', set(true))]);
  });

  it.each([
    ['already enabled', true],
    ['opted out by an editor', false],
  ])('leaves a post alone when it is %s', (_label, newsletterEnabled) => {
    const result = backfillNewsletterEnabled({ newsletterEnabled });

    expect(result).toBeUndefined();
  });
});
