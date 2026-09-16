import { SOCIAL_PLATFORMS } from '@blog/config';
import { customRenderAsync, screen, within } from '@web/testing/custom-render';

import { SocialLinks } from './social-links';

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

const setup = customRenderAsync(SocialLinks, { social: [] });

describe(`<${SocialLinks.name}/>`, () => {
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

  it('falls back to label-only rendering for a platform with no mapped icon', async () => {
    await setup({
      social: [{ platform: SOCIAL_PLATFORMS.MASTODON, link: mastodonLink }],
    });

    const link = screen.getByRole('link', { name: 'Mastodon' });

    expect(link).toHaveAttribute('href', 'https://mastodon.social/@example');
    expect(
      within(link).queryByTestId(`social-icon-${SOCIAL_PLATFORMS.MASTODON}`),
    ).not.toBeInTheDocument();
  });

  it('renders no links when social is empty', async () => {
    await setup({ social: [] });

    expect(screen.queryAllByRole('link')).toHaveLength(0);
  });

  it('renders each link unwrapped by default, so it composes directly into a flat nav', async () => {
    const { container } = await setup({
      social: [{ platform: SOCIAL_PLATFORMS.LINKEDIN, link: linkedInLink }],
    });

    expect(container.querySelectorAll('li')).toHaveLength(0);
  });

  it('wraps each link in the given itemAs element, for composing into a list', async () => {
    await setup({
      social: [
        { platform: SOCIAL_PLATFORMS.LINKEDIN, link: linkedInLink },
        { platform: SOCIAL_PLATFORMS.GITHUB, link: githubLink },
      ],
      itemAs: 'li',
    });

    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(within(items[0]!).getByRole('link')).toHaveAccessibleName(
      'LinkedIn profile',
    );
    expect(within(items[1]!).getByRole('link')).toHaveAccessibleName(
      'GitHub profile',
    );
  });
});
