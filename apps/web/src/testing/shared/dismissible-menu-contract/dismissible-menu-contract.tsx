import type { UserEvent } from '@testing-library/user-event';
import { fireEvent, screen } from '@web/testing/custom-render';
import { ARIA_EXPANDED } from '@web/testing/shared/aria/constants';
import {
  KEY_ARROW_DOWN,
  KEY_ARROW_UP,
  KEY_END,
} from '@web/testing/shared/keyboard/constants';

export const MENU_TRIGGER_NAME = 'trigger';
export const MENU_FIRST_ITEM_NAME = 'first';
export const MENU_LAST_ITEM_NAME = 'second';
export const MENU_SIBLING_ACTION_NAME = 'sibling action';

export const expectMenuClosed = (trigger: HTMLElement) => {
  expect(trigger).toHaveAttribute(ARIA_EXPANDED, 'false');
};

export const expectMenuOpen = (trigger: HTMLElement) => {
  expect(trigger).toHaveAttribute(ARIA_EXPANDED, 'true');
};

type TGetUser = () => UserEvent;

export const testCoreDismissibleMenuBehavior = (getUser: TGetUser) => {
  it('starts closed, with the panel contents unreachable', () => {
    const trigger = screen.getByRole('button', { name: MENU_TRIGGER_NAME });
    const firstItem = screen.queryByRole('button', {
      name: MENU_FIRST_ITEM_NAME,
    });

    expectMenuClosed(trigger);
    expect(firstItem).not.toBeInTheDocument();
  });

  it('opens on toggle and focuses the first item in the panel', async () => {
    const trigger = screen.getByRole('button', { name: MENU_TRIGGER_NAME });

    await getUser().click(trigger);

    const firstItem = screen.getByRole('button', {
      name: MENU_FIRST_ITEM_NAME,
    });
    expectMenuOpen(trigger);
    expect(firstItem).toHaveFocus();
  });

  it('closes on a second toggle and returns focus to the trigger', async () => {
    const trigger = screen.getByRole('button', { name: MENU_TRIGGER_NAME });

    await getUser().click(trigger);
    await getUser().click(trigger);

    expectMenuClosed(trigger);
    expect(trigger).toHaveFocus();
  });

  it('closes on Escape and returns focus to the trigger', async () => {
    const trigger = screen.getByRole('button', { name: MENU_TRIGGER_NAME });
    await getUser().click(trigger);

    await getUser().keyboard('{Escape}');

    expectMenuClosed(trigger);
    expect(trigger).toHaveFocus();
  });

  it('closes on an outside pointer-down and returns focus to the trigger', async () => {
    const trigger = screen.getByRole('button', { name: MENU_TRIGGER_NAME });
    await getUser().click(trigger);

    fireEvent.mouseDown(document.body);

    expectMenuClosed(trigger);
    expect(trigger).toHaveFocus();
  });

  it('stays open on a pointer-down inside the panel', async () => {
    const trigger = screen.getByRole('button', { name: MENU_TRIGGER_NAME });
    await getUser().click(trigger);

    const lastItem = screen.getByRole('button', { name: MENU_LAST_ITEM_NAME });
    fireEvent.mouseDown(lastItem);

    expectMenuOpen(trigger);
  });

  it('wraps Tab from the last item back to the first', async () => {
    const trigger = screen.getByRole('button', { name: MENU_TRIGGER_NAME });
    await getUser().click(trigger);
    const firstItem = screen.getByRole('button', {
      name: MENU_FIRST_ITEM_NAME,
    });
    await getUser().keyboard(KEY_END);

    await getUser().tab();

    expect(firstItem).toHaveFocus();
  });

  it('moves focus down with ArrowDown, wrapping from the last to the first', async () => {
    const trigger = screen.getByRole('button', { name: MENU_TRIGGER_NAME });
    await getUser().click(trigger);
    const firstItem = screen.getByRole('button', {
      name: MENU_FIRST_ITEM_NAME,
    });
    const lastItem = screen.getByRole('button', { name: MENU_LAST_ITEM_NAME });

    await getUser().keyboard(KEY_ARROW_DOWN);
    expect(lastItem).toHaveFocus();

    await getUser().keyboard(KEY_ARROW_DOWN);
    expect(firstItem).toHaveFocus();
  });

  it('focuses the last item on End', async () => {
    const trigger = screen.getByRole('button', { name: MENU_TRIGGER_NAME });
    await getUser().click(trigger);
    const lastItem = screen.getByRole('button', { name: MENU_LAST_ITEM_NAME });

    await getUser().keyboard(KEY_END);

    expect(lastItem).toHaveFocus();
  });
};

export const testArrowUpAndHomeBehavior = (getUser: TGetUser) => {
  it('wraps ArrowUp from the first item to the last', async () => {
    const trigger = screen.getByRole('button', { name: MENU_TRIGGER_NAME });
    await getUser().click(trigger);
    const lastItem = screen.getByRole('button', { name: MENU_LAST_ITEM_NAME });

    await getUser().keyboard(KEY_ARROW_UP);

    expect(lastItem).toHaveFocus();
  });

  it('moves focus up with ArrowUp from the last item', async () => {
    const trigger = screen.getByRole('button', { name: MENU_TRIGGER_NAME });
    await getUser().click(trigger);
    const firstItem = screen.getByRole('button', {
      name: MENU_FIRST_ITEM_NAME,
    });
    await getUser().keyboard(KEY_END);

    await getUser().keyboard(KEY_ARROW_UP);

    expect(firstItem).toHaveFocus();
  });

  it('focuses the first item on Home', async () => {
    const trigger = screen.getByRole('button', { name: MENU_TRIGGER_NAME });
    await getUser().click(trigger);
    const firstItem = screen.getByRole('button', {
      name: MENU_FIRST_ITEM_NAME,
    });
    await getUser().keyboard(KEY_END);

    await getUser().keyboard('{Home}');

    expect(firstItem).toHaveFocus();
  });
};
