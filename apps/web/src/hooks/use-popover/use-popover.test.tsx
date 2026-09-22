import userEvent from '@testing-library/user-event';
import { customRender, screen } from '@web/testing/custom-render';
import {
  testArrowUpAndHomeBehavior,
  testCoreDismissibleMenuBehavior,
} from '@web/testing/shared/dismissible-menu-contract/dismissible-menu-contract';

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
        trigger
      </button>
      <div ref={panelRef} hidden={!open}>
        <button type="button">first</button>
        <button type="button" onClick={close}>
          second
        </button>
      </div>
    </div>
  );
};

const setup = customRender(Harness, {});

describe(usePopover, () => {
  beforeEach(() => {
    setup();
  });

  testCoreDismissibleMenuBehavior();
  testArrowUpAndHomeBehavior();

  it('exposes a close function that closes the panel and returns focus to the trigger', async () => {
    const user = userEvent.setup();
    const trigger = screen.getByRole('button', { name: 'trigger' });

    await user.click(trigger);
    await user.click(screen.getByRole('button', { name: 'second' }));

    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveFocus();
  });
});
