import { renderElement, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { createRef, type ReactNode, type Ref } from 'react';

import { PopoverMenu } from './popover-menu';

faker.seed(123);

const MOCK_TRIGGER_LABEL = faker.lorem.words(2);
const MOCK_PANEL_ID = faker.string.uuid();
const MOCK_ITEM_LABEL = faker.lorem.words(2);
const MOCK_LINK_ITEM_LABEL = faker.lorem.words(2);
const MOCK_HREF = faker.internet.url();

const renderMenu = ({
  isOpen = true,
  items = <PopoverMenu.Item>{MOCK_ITEM_LABEL}</PopoverMenu.Item>,
  triggerRef,
}: {
  isOpen?: boolean;
  items?: ReactNode;
  triggerRef?: Ref<HTMLButtonElement>;
} = {}) =>
  renderElement(
    <PopoverMenu>
      <PopoverMenu.Trigger
        ariaLabel={MOCK_TRIGGER_LABEL}
        isOpen={isOpen}
        panelId={MOCK_PANEL_ID}
        ref={triggerRef}
      >
        {faker.lorem.word()}
      </PopoverMenu.Trigger>
      <PopoverMenu.Panel id={MOCK_PANEL_ID} isOpen={isOpen}>
        {items}
      </PopoverMenu.Panel>
    </PopoverMenu>,
  );

describe(`<${PopoverMenu.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  it('renders a trigger with the menu-button ARIA attributes', () => {
    renderMenu({ isOpen: false });

    const trigger = screen.getByRole('button', { name: MOCK_TRIGGER_LABEL });

    expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveAttribute('aria-controls', MOCK_PANEL_ID);
  });

  it('forwards a ref on the trigger to the underlying button', () => {
    const triggerRef = createRef<HTMLButtonElement>();
    renderMenu({ isOpen: false, triggerRef });

    const trigger = screen.getByRole('button', { name: MOCK_TRIGGER_LABEL });

    expect(triggerRef.current).toBe(trigger);
  });

  it('hides the panel while closed', () => {
    renderMenu({ isOpen: false });

    const menu = screen.queryByRole('menu');

    expect(menu).not.toBeInTheDocument();
  });

  it('shows the panel while open', () => {
    renderMenu({ isOpen: true });

    const menu = screen.getByRole('menu');

    expect(menu).toBeVisible();
  });

  it('renders each Item as a menu item, an anchor when given href', () => {
    renderMenu({
      items: (
        <>
          <PopoverMenu.Item>{MOCK_ITEM_LABEL}</PopoverMenu.Item>
          <PopoverMenu.Item as="a" href={MOCK_HREF}>
            {MOCK_LINK_ITEM_LABEL}
          </PopoverMenu.Item>
        </>
      ),
    });

    const menuItems = screen.getAllByRole('menuitem');
    const linkItem = screen.getByRole('menuitem', {
      name: MOCK_LINK_ITEM_LABEL,
    });

    expect(menuItems).toHaveLength(2);
    expect(linkItem).toHaveAttribute('href', MOCK_HREF);
  });

  it('calls onClick when a button Item is clicked', async () => {
    const onClick = vi.fn();
    renderMenu({
      items: (
        <PopoverMenu.Item onClick={onClick}>{MOCK_ITEM_LABEL}</PopoverMenu.Item>
      ),
    });

    const item = screen.getByRole('menuitem', { name: MOCK_ITEM_LABEL });
    await user.click(item);

    expect(onClick).toHaveBeenCalledOnce();
  });

  it('renders a Separator between Items', () => {
    renderMenu({
      items: (
        <>
          <PopoverMenu.Item>{MOCK_ITEM_LABEL}</PopoverMenu.Item>
          <PopoverMenu.Separator />
          <PopoverMenu.Item>{MOCK_LINK_ITEM_LABEL}</PopoverMenu.Item>
        </>
      ),
    });

    const separator = screen.getByRole('separator');

    expect(separator).toBeVisible();
  });
});
