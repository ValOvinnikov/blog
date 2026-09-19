import userEvent from '@testing-library/user-event';
import { customRender, fireEvent, screen } from '@web/testing/custom-render';
import { testCoreDismissibleMenuBehavior } from '@web/testing/shared/dismissible-menu-contract/dismissible-menu-contract';
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
        trigger
      </button>
      <div id={panelId} hidden={!open}>
        <button type="button">first</button>
        <button type="button">second</button>
      </div>
      <button type="button">sibling action</button>
    </div>
  );
};

const setup = customRender(Harness, {});

const getTrigger = () => screen.getByRole('button', { name: 'trigger' });

describe(useMobileNavToggle, () => {
  beforeEach(() => {
    setup();
  });

  testCoreDismissibleMenuBehavior();

  it('stays open on a pointer-down on a sibling element inside the shared container (e.g. the actions slot)', async () => {
    const user = userEvent.setup();
    const trigger = getTrigger();
    await user.click(trigger);

    fireEvent.mouseDown(screen.getByRole('button', { name: 'sibling action' }));

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });
});
