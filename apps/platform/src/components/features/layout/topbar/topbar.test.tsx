import { ADMIN_ROLE, MEMBERSHIP_ROLE } from '@blog/db/constants';
import { faker } from '@faker-js/faker';
import messages from '@platform/i18n/messages/en.json';
import { customRender, screen, within } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import {
  mockNavLinkItem,
  mockNavSection,
} from '@platform/testing/layout/fixtures';
import userEvent from '@testing-library/user-event';

import { Topbar } from './topbar';

vi.mock('@platform/i18n/navigation');
vi.mock('@platform/server/auth/sign-out-action');

faker.seed(5993);

const MOCK_CRUMB_TEXT = faker.lorem.words(2);
const MOCK_SCOPE = faker.company.name();
const MOCK_SWITCHER_TEXT = faker.lorem.words(2);
const MOCK_NAV_ITEM = mockNavLinkItem();
const MOCK_ROLE_CHIP = {
  name: faker.person.fullName(),
  role: ADMIN_ROLE.SUPERADMIN,
  scope: MOCK_SCOPE,
};

const t = makeEnTranslator();
const roleChipLabel = (role: string) =>
  t('topbar.roleChip', { role: t(`roleLabel.${role}`), scope: MOCK_SCOPE });

const setup = customRender(Topbar, {
  crumb: <p>{MOCK_CRUMB_TEXT}</p>,
  roleChip: MOCK_ROLE_CHIP,
});

describe(`<${Topbar.name}/>`, () => {
  it('renders the crumb and the role chip with a translated role', () => {
    setup();

    const crumb = screen.getByText(MOCK_CRUMB_TEXT);
    const roleChip = screen.getByText(roleChipLabel(ADMIN_ROLE.SUPERADMIN));
    const rawRole = screen.queryByText(ADMIN_ROLE.SUPERADMIN, {
      exact: false,
    });

    expect(crumb).toBeVisible();
    expect(roleChip).toBeVisible();
    expect(rawRole).not.toBeInTheDocument();
  });

  it('never derives avatar initials from the role when the user has no name', () => {
    setup({
      roleChip: {
        name: undefined,
        role: MEMBERSHIP_ROLE.OWNER,
        scope: MOCK_SCOPE,
      },
    });

    const roleChip = screen.getByText(roleChipLabel(MEMBERSHIP_ROLE.OWNER));
    const roleInitials = screen.queryByText('OW');

    expect(roleChip).toBeVisible();
    expect(roleInitials).not.toBeInTheDocument();
  });

  it('renders no nav menu trigger when no sections are passed', () => {
    setup();

    const trigger = screen.queryByRole('button', {
      name: messages.topbarNavMenu.triggerLabel,
    });

    expect(trigger).not.toBeInTheDocument();
  });

  describe('with the nav menu opened', () => {
    let menu: HTMLElement;

    beforeEach(async () => {
      const user = userEvent.setup();
      setup({
        sections: [mockNavSection({ items: [MOCK_NAV_ITEM] })],
        switcher: <div>{MOCK_SWITCHER_TEXT}</div>,
      });

      const trigger = screen.getByRole('button', {
        name: messages.topbarNavMenu.triggerLabel,
      });
      await user.click(trigger);
      menu = await screen.findByRole('menu');
    });

    it('shows the passed sections', () => {
      const item = within(menu).getByRole('menuitem', {
        name: MOCK_NAV_ITEM.label,
      });

      expect(item).toBeVisible();
    });

    it('shows the switcher slot', () => {
      const switcher = within(menu).getByText(MOCK_SWITCHER_TEXT);

      expect(switcher).toBeVisible();
    });
  });
});
