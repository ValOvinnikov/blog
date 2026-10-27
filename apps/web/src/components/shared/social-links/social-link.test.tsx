import { customRender, screen, within } from '@web/testing/custom-render';
import {
  MOCK_GITHUB_PROFILE,
  MOCK_LINKEDIN_PROFILE,
  MOCK_MASTODON_PROFILE,
} from '@web/testing/shared/social-profile/fixtures';

import { SocialLink } from './social-link';

const LINKEDIN_PROFILE_NAME = 'LinkedIn profile';

const setup = customRender(SocialLink, MOCK_LINKEDIN_PROFILE);

describe(`<${SocialLink.name}/>`, () => {
  it.each([
    {
      profile: MOCK_LINKEDIN_PROFILE,
      expectedName: LINKEDIN_PROFILE_NAME,
    },
    { profile: MOCK_GITHUB_PROFILE, expectedName: 'GitHub profile' },
    { profile: MOCK_MASTODON_PROFILE, expectedName: 'Mastodon profile' },
  ])(
    'names the $expectedName link and shows its platform icon',
    ({ profile: { platform, link }, expectedName }) => {
      setup({ platform, link });

      const socialLink = screen.getByRole('link', { name: expectedName });
      const icon = within(socialLink).getByTestId(`social-icon-${platform}`);

      expect(socialLink).toHaveAttribute('href', link.href);
      expect(icon).toBeVisible();
    },
  );

  it('honours the authored target', () => {
    setup();

    const socialLink = screen.getByRole('link', {
      name: LINKEDIN_PROFILE_NAME,
    });

    expect(socialLink).toHaveAttribute(
      'target',
      MOCK_LINKEDIN_PROFILE.link.target,
    );
  });
});
