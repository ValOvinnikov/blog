import { ICONS } from '@blog/config';

import { toSocialIconName } from './to-social-icon-name';

describe('toSocialIconName', () => {
  it.each([
    ['X', ICONS.X],
    ['x', ICONS.X],
    ['Twitter', ICONS.X],
    ['GitHub', ICONS.GITHUB],
    ['github', ICONS.GITHUB],
    ['LinkedIn', ICONS.LINKEDIN],
    ['Facebook', ICONS.FACEBOOK],
    ['RSS', ICONS.RSS],
    ['  GitHub  ', ICONS.GITHUB],
  ])('maps %s to %s', (platform, iconName) => {
    expect(toSocialIconName(platform)).toBe(iconName);
  });

  it('returns undefined for a platform outside the current icon set', () => {
    expect(toSocialIconName('Mastodon')).toBeUndefined();
  });
});
