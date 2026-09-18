import userEvent from '@testing-library/user-event';
import { fireEvent, screen } from '@web/testing/custom-render';

const getTrigger = () => screen.getByRole('button', { name: 'trigger' });

/**
 * The open/close/focus contract every dismissible-menu-style hook shares —
 * `usePopover`, `useDismissibleMenu`'s default options, and
 * `useMobileNavToggle` all render a harness with a "trigger" button and a
 * panel containing "first"/"second" buttons.
 */
export const testCoreDismissibleMenuBehavior = () => {
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
};

/**
 * The roving-focus behaviours `usePopover` and `useDismissibleMenu`'s
 * default options share beyond the core contract above — not exercised by
 * `useMobileNavToggle`'s own test suite.
 */
export const testArrowUpAndHomeBehavior = () => {
  it('moves focus to the previous item on ArrowUp, wrapping from the first to the last', async () => {
    const user = userEvent.setup();
    await user.click(getTrigger());

    const last = screen.getByRole('button', { name: 'second' });

    fireEvent.keyDown(document, { key: 'ArrowUp' });

    expect(document.activeElement).toBe(last);
  });

  it('moves focus to the previous item on ArrowUp when not on the first item', async () => {
    const user = userEvent.setup();
    await user.click(getTrigger());

    const first = screen.getByRole('button', { name: 'first' });
    const last = screen.getByRole('button', { name: 'second' });
    last.focus();

    fireEvent.keyDown(document, { key: 'ArrowUp' });

    expect(document.activeElement).toBe(first);
  });

  it('focuses the first item on Home', async () => {
    const user = userEvent.setup();
    await user.click(getTrigger());

    const first = screen.getByRole('button', { name: 'first' });
    const last = screen.getByRole('button', { name: 'second' });
    last.focus();

    fireEvent.keyDown(document, { key: 'Home' });

    expect(document.activeElement).toBe(first);
  });
};
