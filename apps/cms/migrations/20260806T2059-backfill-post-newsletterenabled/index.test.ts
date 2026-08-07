import { at, set } from 'sanity/migrate';

import { backfillNewsletterEnabled } from './index';

describe(backfillNewsletterEnabled, () => {
  it('sets newsletterEnabled to true on a post that never had the field', () => {
    const result = backfillNewsletterEnabled({});

    expect(result).toEqual([at('newsletterEnabled', set(true))]);
  });

  it('is idempotent — a post already migrated to true is left alone', () => {
    const result = backfillNewsletterEnabled({ newsletterEnabled: true });

    expect(result).toBeUndefined();
  });

  it('is idempotent — a post an editor already opted out (false) is never clobbered', () => {
    const result = backfillNewsletterEnabled({ newsletterEnabled: false });

    expect(result).toBeUndefined();
  });
});
