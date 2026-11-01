import { faker } from '@faker-js/faker';
import messages from '@platform/i18n/messages/en.json';
import { usePathname } from '@platform/i18n/navigation';
import { ARIA_CURRENT } from '@platform/testing/aria';
import { customRender, screen, within } from '@platform/testing/custom-render';
import {
  mockNavBadge,
  mockNavInertItem,
  mockNavLinkItem,
  mockNavSection,
} from '@platform/testing/layout/fixtures';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { TopbarNavMenu } from './topbar-nav-menu';

vi.mock('@platform/i18n/navigation');

faker.seed(5993);

const MOCK_LOOK_ITEM = mockNavLinkItem();
const MOCK_VOICE_ITEM = mockNavLinkItem();
const MOCK_BADGE = mockNavBadge();
const MOCK_BADGED_ITEM = mockNavLinkItem({ badge: MOCK_BADGE });
const MOCK_NOTE = faker.lorem.sentence();
const MOCK_SWITCHER_TEXT = faker.lorem.words(2);
const MOCK_SECTION = mockNavSection({ items: [MOCK_LOOK_ITEM] });

const setup = customRender(TopbarNavMenu, { sections: [MOCK_SECTION] });

describe(`<${TopbarNavMenu.name}/>`, () => {
  let user: UserEvent;

  const openMenu = async () => {
    const trigger = screen.getByRole('button', {
      name: messages.topbarNavMenu.triggerLabel,
    });
    await user.click(trigger);
    return screen.findByRole('menu');
  };

  beforeEach(() => {
    user = userEvent.setup();
    vi.mocked(usePathname).mockReset();
  });

  it('renders a closed trigger by default', () => {
    setup();

    const trigger = screen.getByRole('button', {
      name: messages.topbarNavMenu.triggerLabel,
    });
    const menu = screen.queryByRole('menu');

    expect(trigger).toBeVisible();
    expect(menu).not.toBeInTheDocument();
  });

  it('opens the popup on click, showing items, badges and notes', async () => {
    setup({
      sections: [
        mockNavSection({ items: [MOCK_BADGED_ITEM] }),
        mockNavSection({ items: [], note: MOCK_NOTE }),
      ],
    });

    const menu = await openMenu();
    const link = within(menu).getByRole('menuitem', {
      name: `${MOCK_BADGED_ITEM.label}${MOCK_BADGE.label}`,
    });
    const badge = within(link).getByText(MOCK_BADGE.label);
    const note = within(menu).getByText(MOCK_NOTE);

    expect(link).toHaveAttribute('href', MOCK_BADGED_ITEM.href);
    expect(badge).toBeVisible();
    expect(note).toBeVisible();
  });

  it('marks only the item matching the current pathname active', async () => {
    vi.mocked(usePathname).mockReturnValue(MOCK_LOOK_ITEM.href);
    setup({
      sections: [mockNavSection({ items: [MOCK_LOOK_ITEM, MOCK_VOICE_ITEM] })],
    });

    const menu = await openMenu();
    const activeItem = within(menu).getByRole('menuitem', {
      name: MOCK_LOOK_ITEM.label,
    });
    const inactiveItem = within(menu).getByRole('menuitem', {
      name: MOCK_VOICE_ITEM.label,
    });

    expect(activeItem).toHaveAttribute(ARIA_CURRENT, 'page');
    expect(inactiveItem).not.toHaveAttribute(ARIA_CURRENT);
  });

  it('renders an item with no href as an inert row with its badge', async () => {
    const inertItem = mockNavInertItem({ badge: MOCK_BADGE });
    setup({ sections: [mockNavSection({ items: [inertItem] })] });

    const menu = await openMenu();
    const menuItem = within(menu).queryByRole('menuitem');
    const label = within(menu).getByText(inertItem.label);
    const badge = within(menu).getByText(MOCK_BADGE.label);

    expect(menuItem).not.toBeInTheDocument();
    expect(label).toBeVisible();
    expect(badge).toBeVisible();
  });

  it('closes the popup after clicking a link item', async () => {
    setup();

    const menu = await openMenu();
    const link = within(menu).getByRole('menuitem', {
      name: MOCK_LOOK_ITEM.label,
    });
    await user.click(link);

    const closedMenu = screen.queryByRole('menu');
    expect(closedMenu).not.toBeInTheDocument();
  });

  it('renders the switcher slot above the nav sections when provided', async () => {
    setup({ switcher: <div>{MOCK_SWITCHER_TEXT}</div> });

    const menu = await openMenu();
    const switcher = within(menu).getByText(MOCK_SWITCHER_TEXT);

    expect(switcher).toBeVisible();
    expect(menu).toHaveTextContent(
      new RegExp(`${MOCK_SWITCHER_TEXT}.*${MOCK_SECTION.label}`),
    );
  });

  it('renders no switcher slot when none is provided', async () => {
    setup();

    const menu = await openMenu();
    const switcher = within(menu).queryByText(MOCK_SWITCHER_TEXT);

    expect(switcher).not.toBeInTheDocument();
  });
});
