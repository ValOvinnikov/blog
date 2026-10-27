import userEvent, { type UserEvent } from '@testing-library/user-event';
import { customRender, fireEvent, screen } from '@web/testing/custom-render';
import {
  expectMenuOpen,
  MENU_FIRST_ITEM_NAME,
  MENU_LAST_ITEM_NAME,
  MENU_SIBLING_ACTION_NAME,
  MENU_TRIGGER_NAME,
  testCoreDismissibleMenuBehavior,
} from '@web/testing/hooks/use-dismissible-menu/contract';
import { useId } from 'react';

import { useMobileNavToggle } from './use-mobile-nav-toggle';

const Harness = () => {
  const panelId = useId();
  const { open, toggle, containerRef } = useMobileNavToggle(panelId);

  return (
    <div ref={containerRef}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={toggle}
      >
        {MENU_TRIGGER_NAME}
      </button>
      <div id={panelId} hidden={!open}>
        <button type="button">{MENU_FIRST_ITEM_NAME}</button>
        <button type="button">{MENU_LAST_ITEM_NAME}</button>
      </div>
      <button type="button">{MENU_SIBLING_ACTION_NAME}</button>
    </div>
  );
};

const setup = customRender(Harness, {});

describe(useMobileNavToggle, () => {
  let user: UserEvent;
  const getUser = () => user;

  beforeEach(() => {
    user = userEvent.setup();
    setup();
  });

  testCoreDismissibleMenuBehavior(getUser);

  it('stays open on a pointer-down on a sibling inside the shared container', async () => {
    const trigger = screen.getByRole('button', { name: MENU_TRIGGER_NAME });
    await user.click(trigger);
    const siblingAction = screen.getByRole('button', {
      name: MENU_SIBLING_ACTION_NAME,
    });

    fireEvent.mouseDown(siblingAction);

    expectMenuOpen(trigger);
  });
});
