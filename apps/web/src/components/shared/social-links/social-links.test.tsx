import { customRender, screen, within } from '@web/testing/custom-render';
import {
  MOCK_GITHUB_PROFILE,
  MOCK_LINKEDIN_PROFILE,
} from '@web/testing/shared/social-profile/fixtures';

import { SocialLinks } from './social-links';

const LIST_NAME = 'Profiles';

const setup = customRender(SocialLinks, { profiles: [] });

describe(`<${SocialLinks.name}/>`, () => {
  it('renders a labelled list with no items when profiles is empty', () => {
    setup();

    const list = screen.getByRole('list', { name: LIST_NAME });
    const listitems = within(list).queryAllByRole('listitem');

    expect(listitems).toHaveLength(0);
  });

  it('renders one list item per profile', () => {
    setup({ profiles: [MOCK_GITHUB_PROFILE, MOCK_LINKEDIN_PROFILE] });

    const list = screen.getByRole('list', { name: LIST_NAME });
    const githubLink = within(list).getByRole('link', {
      name: 'GitHub profile',
    });
    const linkedInLink = within(list).getByRole('link', {
      name: 'LinkedIn profile',
    });
    const listitems = within(list).getAllByRole('listitem');

    expect(listitems).toHaveLength(2);
    expect(githubLink).toHaveAttribute('href', MOCK_GITHUB_PROFILE.link.href);
    expect(linkedInLink).toHaveAttribute(
      'href',
      MOCK_LINKEDIN_PROFILE.link.href,
    );
  });
});
