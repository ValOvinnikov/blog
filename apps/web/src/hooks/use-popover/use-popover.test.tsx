import userEvent, { type UserEvent } from '@testing-library/user-event';
import { customRender, screen } from '@web/testing/custom-render';
import {
  expectMenuClosed,
  MENU_FIRST_ITEM_NAME,
  MENU_LAST_ITEM_NAME,
  MENU_TRIGGER_NAME,
  testArrowUpAndHomeBehavior,
  testCoreDismissibleMenuBehavior,
} from '@web/testing/hooks/use-dismissible-menu/contract';

import { usePopover } from './use-popover';

const Harness = () => {
  const { open, toggle, close, triggerRef, panelRef } = usePopover();

  return (
    <div>
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        onClick={toggle}
      >
        {MENU_TRIGGER_NAME}
      </button>
      <div ref={panelRef} hidden={!open}>
        <button type="button">{MENU_FIRST_ITEM_NAME}</button>
        <button type="button" onClick={close}>
          {MENU_LAST_ITEM_NAME}
        </button>
      </div>
    </div>
  );
};

const setup = customRender(Harness, {});

describe(usePopover, () => {
  let user: UserEvent;
  const getUser = () => user;

  beforeEach(() => {
    user = userEvent.setup();
    setup();
  });

  testCoreDismissibleMenuBehavior(getUser);
  testArrowUpAndHomeBehavior(getUser);

  it('closes from inside the panel and returns focus to the trigger', async () => {
    const trigger = screen.getByRole('button', { name: MENU_TRIGGER_NAME });
    await user.click(trigger);
    const closeItem = screen.getByRole('button', { name: MENU_LAST_ITEM_NAME });

    await user.click(closeItem);

    expectMenuClosed(trigger);
    expect(trigger).toHaveFocus();
  });
});
