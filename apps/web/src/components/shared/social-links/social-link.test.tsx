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
  it('derives the accessible name for a mapped platform from SOCIAL_PLATFORM_LABEL, not a naive title-case', () => {
    setup();

    const link = screen.getByRole('link', { name: 'LinkedIn profile' });

    expect(link).toHaveAttribute('href', 'https://www.linkedin.com/in/example');
    expect(
      within(link).getByTestId(`social-icon-${SOCIAL_PLATFORMS.LINKEDIN}`),
    ).toBeVisible();
  });

  it('derives the accessible name for GitHub with corrected casing', () => {
    setup({ platform: SOCIAL_PLATFORMS.GITHUB, link: githubLink });

    expect(
      screen.getByRole('link', { name: 'GitHub profile' }),
    ).toHaveAttribute('href', 'https://github.com/example');
  });

  it('renders an icon and the translated accessible name for a platform outside the original 6-key set', () => {
    setup({ platform: SOCIAL_PLATFORMS.MASTODON, link: mastodonLink });

    const link = screen.getByRole('link', { name: 'Mastodon profile' });

    expect(link).toHaveAttribute('href', 'https://mastodon.social/@example');
    expect(
      within(link).getByTestId(`social-icon-${SOCIAL_PLATFORMS.MASTODON}`),
    ).toBeVisible();
  });

  it('honours the authored target', () => {
    setup();

    expect(
      screen.getByRole('link', { name: 'LinkedIn profile' }),
    ).toHaveAttribute('target', '_blank');
  });
});
