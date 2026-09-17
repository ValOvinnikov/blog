import { SOCIAL_PLATFORMS } from '@blog/config';
import { customRenderAsync, screen, within } from '@web/testing/custom-render';

import { FooterSocialLinks } from './footer-social-links';

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

const setup = customRenderAsync(FooterSocialLinks, { social: [] });

describe(`<${FooterSocialLinks.name}/>`, () => {
  it('derives the accessible name for a mapped platform from SOCIAL_PLATFORM_LABEL, not a naive title-case', async () => {
    await setup({
      social: [{ platform: SOCIAL_PLATFORMS.LINKEDIN, link: linkedInLink }],
    });

    const link = screen.getByRole('link', { name: 'LinkedIn profile' });

    expect(link).toHaveAttribute('href', 'https://www.linkedin.com/in/example');
    expect(
      within(link).getByTestId(`social-icon-${SOCIAL_PLATFORMS.LINKEDIN}`),
    ).toBeVisible();
  });

  it('derives the accessible name for GitHub with corrected casing', async () => {
    await setup({
      social: [{ platform: SOCIAL_PLATFORMS.GITHUB, link: githubLink }],
    });

    expect(
      screen.getByRole('link', { name: 'GitHub profile' }),
    ).toHaveAttribute('href', 'https://github.com/example');
  });

  it('renders an icon and the translated accessible name for a platform outside the original 6-key set', async () => {
    await setup({
      social: [{ platform: SOCIAL_PLATFORMS.MASTODON, link: mastodonLink }],
    });

    const link = screen.getByRole('link', { name: 'Mastodon profile' });

    expect(link).toHaveAttribute('href', 'https://mastodon.social/@example');
    expect(
      within(link).getByTestId(`social-icon-${SOCIAL_PLATFORMS.MASTODON}`),
    ).toBeVisible();
  });

  it('renders no links when social is empty', async () => {
    await setup({ social: [] });

    expect(screen.queryAllByRole('link')).toHaveLength(0);
  });
});
