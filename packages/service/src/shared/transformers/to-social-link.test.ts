import {
  makeRawSharedLink,
  makeRawSocialLinkRef,
} from '@blog/service/testing/shared/fixtures';

import { toSocialLink } from './to-social-link';

describe('toSocialLink', () => {
  it('resolves the shared link and carries the per-use platform onto it', () => {
    const result = toSocialLink(
      makeRawSocialLinkRef({
        platform: 'GITHUB',
        link: makeRawSharedLink({
          label: 'GitHub',
          url: 'https://github.com/val',
        }),
      }),
    );

    expect(result).toEqual({
      label: 'GitHub',
      href: 'https://github.com/val',
      target: undefined,
      platform: 'GITHUB',
    });
  });

  it('returns undefined when the shared link reference is dangling', () => {
    const result = toSocialLink(makeRawSocialLinkRef({ link: null }));

    expect(result).toBeUndefined();
  });

  it("uses labelOverride instead of the shared link's own label when set", () => {
    const result = toSocialLink(
      makeRawSocialLinkRef({ labelOverride: 'Follow on GitHub' }),
    );

    expect(result?.label).toBe('Follow on GitHub');
  });
});
