import { ACCOUNT_BUTTON_STYLE } from '@blog/config';
import { customRender, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';
import userEvent from '@testing-library/user-event';
import type { Mock } from 'vitest';

import { AccountTrigger } from './account-trigger';

faker.seed(123);

const MOCK_SIGN_IN_LABEL = faker.lorem.words(2);
const MOCK_ACCOUNT_LABEL = faker.lorem.word();
const MOCK_PANEL_ID = faker.string.uuid();
const HASPOPUP_ATTRIBUTE = 'aria-haspopup';
const MOCK_USER = { name: faker.person.fullName() };

const setup = customRender(AccountTrigger, {
  appearance: ACCOUNT_BUTTON_STYLE.PILL,
  labels: { signIn: MOCK_SIGN_IN_LABEL, account: MOCK_ACCOUNT_LABEL },
  isOpen: false,
  panelId: MOCK_PANEL_ID,
});

describe.each(Object.values(ACCOUNT_BUTTON_STYLE))(
  `<${AccountTrigger.name}/> as %s while signed out`,
  (appearance) => {
    let onClick: Mock<() => void>;
    let button: HTMLElement;

    beforeEach(() => {
      onClick = vi.fn();
      setup({ appearance, onClick });
      button = screen.getByRole('button', { name: MOCK_SIGN_IN_LABEL });
    });

    it('is named for signing in and opens a dialog', () => {
      expect(button).toHaveAttribute(HASPOPUP_ATTRIBUTE, 'dialog');
    });

    it('reports whether its panel is open and which panel it controls', () => {
      expect(button).toHaveAttribute('aria-expanded', 'false');
      expect(button).toHaveAttribute('aria-controls', MOCK_PANEL_ID);
    });

    it('calls onClick when pressed', async () => {
      await userEvent.click(button);

      expect(onClick).toHaveBeenCalledOnce();
    });
  },
);

describe.each(Object.values(ACCOUNT_BUTTON_STYLE))(
  `<${AccountTrigger.name}/> as %s while signed in`,
  (appearance) => {
    it('is named for the account and opens a menu', () => {
      setup({ appearance, user: MOCK_USER });

      const button = screen.getByRole('button', { name: MOCK_ACCOUNT_LABEL });

      expect(button).toHaveAttribute(HASPOPUP_ATTRIBUTE, 'menu');
    });
  },
);
