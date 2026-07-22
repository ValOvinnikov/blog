import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { usePopover } from './use-popover';

/**
 * Minimal harness that wires the hook's refs onto a real trigger + panel so
 * the DOM-dependent behaviour (focus management, outside-click, Tab-trap) can
 * be exercised directly against the hook, independent of any component.
 */
const Harness = () => {
  const { open, toggle, triggerRef, panelRef } = usePopover();

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
        <button type="button">second</button>
      </div>
    </div>
  );
};

const getTrigger = () => screen.getByRole('button', { name: 'trigger' });

describe(usePopover, () => {
  it('starts closed, with the panel contents unreachable', () => {
    render(<Harness />);

    expect(getTrigger()).toHaveAttribute('aria-expanded', 'false');
    expect(
      screen.queryByRole('button', { name: 'first' }),
    ).not.toBeInTheDocument();
  });

  it('opens on toggle and moves focus to the first focusable item in the panel', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(getTrigger());

    expect(getTrigger()).toHaveAttribute('aria-expanded', 'true');
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: 'first' }),
    );
  });

  it('closes on a second toggle and returns focus to the trigger', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const trigger = getTrigger();

    await user.click(trigger);
    await user.click(trigger);

    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(document.activeElement).toBe(trigger);
  });

  it('closes on Escape and returns focus to the trigger', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const trigger = getTrigger();
    await user.click(trigger);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(document.activeElement).toBe(trigger);
  });

  it('closes on an outside pointer-down and returns focus to the trigger', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const trigger = getTrigger();
    await user.click(trigger);

    fireEvent.mouseDown(document.body);

    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(document.activeElement).toBe(trigger);
  });

  it('stays open on a pointer-down inside the panel', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const trigger = getTrigger();
    await user.click(trigger);

    fireEvent.mouseDown(screen.getByRole('button', { name: 'second' }));

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('traps Tab, wrapping focus from the last item back to the first', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(getTrigger());

    const first = screen.getByRole('button', { name: 'first' });
    const last = screen.getByRole('button', { name: 'second' });
    last.focus();

    fireEvent.keyDown(document, { key: 'Tab' });

    expect(document.activeElement).toBe(first);
  });

  it('moves focus to the next item on ArrowDown, wrapping from the last back to the first', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(getTrigger());

    const first = screen.getByRole('button', { name: 'first' });
    const last = screen.getByRole('button', { name: 'second' });

    fireEvent.keyDown(document, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(last);

    fireEvent.keyDown(document, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(first);
  });

  it('moves focus to the previous item on ArrowUp, wrapping from the first to the last', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(getTrigger());

    const last = screen.getByRole('button', { name: 'second' });

    fireEvent.keyDown(document, { key: 'ArrowUp' });

    expect(document.activeElement).toBe(last);
  });

  it('moves focus to the previous item on ArrowUp when not on the first item', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(getTrigger());

    const first = screen.getByRole('button', { name: 'first' });
    const last = screen.getByRole('button', { name: 'second' });
    last.focus();

    fireEvent.keyDown(document, { key: 'ArrowUp' });

    expect(document.activeElement).toBe(first);
  });

  it('focuses the first item on Home', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(getTrigger());

    const first = screen.getByRole('button', { name: 'first' });
    const last = screen.getByRole('button', { name: 'second' });
    last.focus();

    fireEvent.keyDown(document, { key: 'Home' });

    expect(document.activeElement).toBe(first);
  });

  it('focuses the last item on End', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(getTrigger());

    const last = screen.getByRole('button', { name: 'second' });

    fireEvent.keyDown(document, { key: 'End' });

    expect(document.activeElement).toBe(last);
  });
});
