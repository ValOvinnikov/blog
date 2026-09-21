import { SOCIAL_PLATFORMS } from '@blog/config';
import { customRender, screen, within } from '@web/testing/custom-render';

import { SocialLinks } from './social-links';

const githubLink = {
  label: 'GitHub',
  href: 'https://github.com/example',
  target: '_blank' as const,
  platform: undefined,
  ariaLabel: undefined,
};

const linkedInLink = {
  label: 'LinkedIn',
  href: 'https://www.linkedin.com/in/example',
  target: '_blank' as const,
  platform: undefined,
  ariaLabel: undefined,
};

const setup = customRender(SocialLinks, { profiles: [] });

describe(`<${SocialLinks.name}/>`, () => {
  it('renders a labelled list with no items when profiles is empty', () => {
    setup();

    const list = screen.getByRole('list', { name: 'Profiles' });
    expect(within(list).queryAllByRole('listitem')).toHaveLength(0);
  });

  it('renders one list item per profile, each exposing its own accessible name', () => {
    setup({
      profiles: [
        { platform: SOCIAL_PLATFORMS.GITHUB, link: githubLink },
        { platform: SOCIAL_PLATFORMS.LINKEDIN, link: linkedInLink },
      ],
    });

    const list = screen.getByRole('list', { name: 'Profiles' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(2);
    expect(
      within(list).getByRole('link', { name: 'GitHub profile' }),
    ).toHaveAttribute('href', 'https://github.com/example');
    expect(
      within(list).getByRole('link', { name: 'LinkedIn profile' }),
    ).toHaveAttribute('href', 'https://www.linkedin.com/in/example');
  });
});
