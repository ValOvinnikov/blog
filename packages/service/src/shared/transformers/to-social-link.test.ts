import { describe, expect, it } from 'vitest';

import { toSocialLink } from './to-social-link';

describe('toSocialLink', () => {
  it('passes through platform and url unchanged', () => {
    expect(
      toSocialLink({ platform: 'twitter', url: 'https://twitter.com/user' }),
    ).toEqual({
      platform: 'twitter',
      url: 'https://twitter.com/user',
    });
  });
});
