import { SOCIAL_PLATFORMS } from '@blog/config';
import { customRender, screen, within } from '@web/testing/custom-render';

import { SocialLink } from './social-link';

const linkedInLink = {
  label: 'LinkedIn',
  href: 'https://www.linkedin.com/in/example',
  target: '_blank' as const,
  platform: undefined,
  ariaLabel: undefined,
};

const githubLink = {
  label: 'GitHub',
  href: 'https://github.com/example',
  target: '_blank' as const,
  platform: undefined,
  ariaLabel: undefined,
};

const mastodonLink = {
  label: 'Mastodon',
  href: 'https://mastodon.social/@example',
  target: '_blank' as const,
  platform: undefined,
  ariaLabel: undefined,
};

const setup = customRender(SocialLink, {
  platform: SOCIAL_PLATFORMS.LINKEDIN,
  link: linkedInLink,
});

describe(`<${SocialLink.name}/>`, () => {
  it.each([
    {
      description:
        'a mapped platform from SOCIAL_PLATFORM_LABEL, not a naive title-case',
      platform: SOCIAL_PLATFORMS.LINKEDIN,
      link: linkedInLink,
      expectedName: 'LinkedIn profile',
    },
    {
      description: 'GitHub with corrected casing',
      platform: SOCIAL_PLATFORMS.GITHUB,
      link: githubLink,
      expectedName: 'GitHub profile',
    },
    {
      description: 'a platform outside the original 6-key set, translated',
      platform: SOCIAL_PLATFORMS.MASTODON,
      link: mastodonLink,
      expectedName: 'Mastodon profile',
    },
  ])(
    'derives the accessible name for $description',
    ({ platform, link, expectedName }) => {
      setup({ platform, link });

      const socialLink = screen.getByRole('link', { name: expectedName });

      expect(socialLink).toHaveAttribute('href', link.href);
      expect(
        within(socialLink).getByTestId(`social-icon-${platform}`),
      ).toBeVisible();
    },
  );

  it('honours the authored target', () => {
    setup();

    expect(
      screen.getByRole('link', { name: 'LinkedIn profile' }),
    ).toHaveAttribute('target', '_blank');
  });
});
