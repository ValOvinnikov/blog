import { ACCOUNT_PANEL_STYLE } from '@blog/config';
import { customRender, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';
import userEvent from '@testing-library/user-event';
import type { Mock } from 'vitest';

import { AccountPanel } from './account-panel';

faker.seed(123);

const MOCK_USER = {
  name: faker.person.fullName(),
  email: faker.internet.email(),
};
const MOCK_BOOKMARKS = {
  href: faker.internet.url(),
  label: faker.lorem.words(2),
  description: faker.lorem.sentence(),
};
const MOCK_SETTINGS = {
  href: faker.internet.url(),
  label: faker.lorem.words(2),
  description: faker.lorem.sentence(),
};
const MOCK_SIGN_OUT_LABEL = faker.lorem.words(2);
const MOCK_PANEL_LABEL = faker.lorem.words(2);

const setup = customRender(AccountPanel, {
  appearance: ACCOUNT_PANEL_STYLE.CARD,
  user: MOCK_USER,
  links: { bookmarks: MOCK_BOOKMARKS, settings: MOCK_SETTINGS },
  signOut: { label: MOCK_SIGN_OUT_LABEL, onClick: () => {} },
  panel: { id: faker.string.uuid(), isOpen: true, ariaLabel: MOCK_PANEL_LABEL },
});

describe.each(Object.values(ACCOUNT_PANEL_STYLE))(
  `<${AccountPanel.name}/> as %s`,
  (appearance) => {
    let onSignOut: Mock<() => void>;

    beforeEach(() => {
      onSignOut = vi.fn();
      setup({
        appearance,
        signOut: { label: MOCK_SIGN_OUT_LABEL, onClick: onSignOut },
      });
    });

    it('shows who is signed in', () => {
      const menu = screen.getByRole('menu', { name: MOCK_PANEL_LABEL });

      expect(menu).toHaveTextContent(MOCK_USER.name);
      expect(menu).toHaveTextContent(MOCK_USER.email);
    });

    it('links to bookmarks and account settings', () => {
      const items = screen.getAllByRole('menuitem');

      expect(items[0]).toHaveAttribute('href', MOCK_BOOKMARKS.href);
      expect(items[1]).toHaveAttribute('href', MOCK_SETTINGS.href);
    });

    it('signs out from its own menu item', async () => {
      await userEvent.click(
        screen.getByRole('menuitem', { name: MOCK_SIGN_OUT_LABEL }),
      );

      expect(onSignOut).toHaveBeenCalledOnce();
    });
  },
);

describe(`<${AccountPanel.name}/> while closed`, () => {
  it('is hidden', () => {
    setup({
      panel: {
        id: faker.string.uuid(),
        isOpen: false,
        ariaLabel: MOCK_PANEL_LABEL,
      },
    });

    const menu = screen.queryByRole('menu', { name: MOCK_PANEL_LABEL });

    expect(menu).not.toBeInTheDocument();
  });
});

describe(`<${AccountPanel.name}/> link descriptions`, () => {
  it('describes each destination in the hub', () => {
    setup({ appearance: ACCOUNT_PANEL_STYLE.HUB });

    const bookmarks = screen.getByRole('menuitem', {
      name: MOCK_BOOKMARKS.label,
    });

    expect(bookmarks).toHaveAccessibleDescription(MOCK_BOOKMARKS.description);
  });

  it.each([ACCOUNT_PANEL_STYLE.CARD, ACCOUNT_PANEL_STYLE.PROFILE])(
    'names each destination without a description in %s',
    (appearance) => {
      setup({ appearance });

      const description = screen.queryByText(MOCK_BOOKMARKS.description);

      expect(description).not.toBeInTheDocument();
    },
  );
});
