import userEvent from '@testing-library/user-event';
import { customRender, fireEvent, screen } from '@web/testing/custom-render';
import { useId } from 'react';

import { useMobileNavToggle } from './use-mobile-nav-toggle';

/**
 * Minimal harness mirroring how `SiteNavigation` composes this hook:
 * `containerRef` wraps the whole tree, and the toggle button / panel are
 * linked to each other (and located by the hook) via `panelId`, exactly like
 * `PrimaryNavigation`'s real `mobileToggle` markup. The "sibling action"
 * button mirrors `SiteNavigation`'s always-visible `actions` slot (e.g.
 * `ThemeToggleButton`) — it lives inside `containerRef` but is neither the
 * resolved trigger nor the resolved panel.
 */
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

  it('starts closed, with the panel contents unreachable', () => {
    expect(getTrigger()).toHaveAttribute('aria-expanded', 'false');
    expect(
      screen.queryByRole('button', { name: 'first' }),
    ).not.toBeInTheDocument();
  });

  it('opens on toggle and moves focus to the first focusable item in the panel', async () => {
    const user = userEvent.setup();

    await user.click(getTrigger());

    expect(getTrigger()).toHaveAttribute('aria-expanded', 'true');
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: 'first' }),
    );
  });

  it('closes on a second toggle and returns focus to the trigger', async () => {
    const user = userEvent.setup();
    const trigger = getTrigger();

    await user.click(trigger);
    await user.click(trigger);

    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(document.activeElement).toBe(trigger);
  });

  it('closes on Escape and returns focus to the trigger', async () => {
    const user = userEvent.setup();
    const trigger = getTrigger();
    await user.click(trigger);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(document.activeElement).toBe(trigger);
  });

  it('closes on an outside pointer-down and returns focus to the trigger', async () => {
    const user = userEvent.setup();
    const trigger = getTrigger();
    await user.click(trigger);

    fireEvent.mouseDown(document.body);

    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(document.activeElement).toBe(trigger);
  });

  it('stays open on a pointer-down inside the panel', async () => {
    const user = userEvent.setup();
    const trigger = getTrigger();
    await user.click(trigger);

    fireEvent.mouseDown(screen.getByRole('button', { name: 'second' }));

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('stays open on a pointer-down on a sibling element inside the shared container (e.g. the actions slot)', async () => {
    const user = userEvent.setup();
    const trigger = getTrigger();
    await user.click(trigger);

    fireEvent.mouseDown(screen.getByRole('button', { name: 'sibling action' }));

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('traps Tab, wrapping focus from the last item back to the first', async () => {
    const user = userEvent.setup();
    await user.click(getTrigger());

    const first = screen.getByRole('button', { name: 'first' });
    const last = screen.getByRole('button', { name: 'second' });
    last.focus();

    fireEvent.keyDown(document, { key: 'Tab' });

    expect(document.activeElement).toBe(first);
  });

  it('moves focus to the next item on ArrowDown, wrapping from the last back to the first', async () => {
    const user = userEvent.setup();
    await user.click(getTrigger());

    const first = screen.getByRole('button', { name: 'first' });
    const last = screen.getByRole('button', { name: 'second' });

    fireEvent.keyDown(document, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(last);

    fireEvent.keyDown(document, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(first);
  });

  it('focuses the last item on End', async () => {
    const user = userEvent.setup();
    await user.click(getTrigger());

    const last = screen.getByRole('button', { name: 'second' });

    fireEvent.keyDown(document, { key: 'End' });

    expect(document.activeElement).toBe(last);
  });
});
