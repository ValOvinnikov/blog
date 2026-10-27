import { SOCIAL_PLATFORMS } from '@blog/config';
import { faker } from '@faker-js/faker';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { customRender, screen, within } from '@web/testing/custom-render';

import { PostShareLinks } from './post-share-links';

faker.seed(5501);

const MOCK_TITLE = faker.lorem.words(2);

const setup = customRender(PostShareLinks, {
  url: faker.internet.url(),
  title: MOCK_TITLE,
});

describe(`<${PostShareLinks.name}/>`, () => {
  let user: UserEvent;

  beforeEach(async () => {
    user = userEvent.setup();
    setup();
    const trigger = screen.getByRole('button', {
      name: `Share "${MOCK_TITLE}"`,
    });

    await user.click(trigger);
  });

  it.each([
    { label: 'Share on X', platform: SOCIAL_PLATFORMS.X },
    { label: 'Share on LinkedIn', platform: SOCIAL_PLATFORMS.LINKEDIN },
  ])(
    'offers a $label link with its own platform icon',
    ({ label, platform }) => {
      const shareLink = screen.getByRole('menuitem', { name: label });
      const icon = within(shareLink).getByTestId(`share-icon-${platform}`);

      expect(shareLink).toBeVisible();
      expect(icon).toBeVisible();
    },
  );
});
