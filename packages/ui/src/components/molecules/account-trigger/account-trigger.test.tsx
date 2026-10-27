import { ACCOUNT_BUTTON_STYLE } from '@blog/config';
import { customRender, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';
import userEvent from '@testing-library/user-event';

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
  `<${AccountTrigger.name}/> as %s`,
  (appearance) => {
    it('is named for signing in and opens a dialog while signed out', () => {
      setup({ appearance });

      const button = screen.getByRole('button', { name: MOCK_SIGN_IN_LABEL });

      expect(button).toHaveAttribute(HASPOPUP_ATTRIBUTE, 'dialog');
    });

    it('is named for the account and opens a menu while signed in', () => {
      setup({ appearance, user: MOCK_USER });

      const button = screen.getByRole('button', { name: MOCK_ACCOUNT_LABEL });

      expect(button).toHaveAttribute(HASPOPUP_ATTRIBUTE, 'menu');
    });

    it('reports whether its panel is open and which panel it controls', () => {
      setup({ appearance, isOpen: true });

      const button = screen.getByRole('button', { name: MOCK_SIGN_IN_LABEL });

      expect(button).toHaveAttribute('aria-expanded', 'true');
      expect(button).toHaveAttribute('aria-controls', MOCK_PANEL_ID);
    });

    it('calls onClick when pressed', async () => {
      const onClick = vi.fn();
      setup({ appearance, onClick });

      await userEvent.click(
        screen.getByRole('button', { name: MOCK_SIGN_IN_LABEL }),
      );

      expect(onClick).toHaveBeenCalledOnce();
    });
  },
);
