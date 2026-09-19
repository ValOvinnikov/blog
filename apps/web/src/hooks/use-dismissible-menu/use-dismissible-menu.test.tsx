import userEvent from '@testing-library/user-event';
import { customRender, fireEvent, screen } from '@web/testing/custom-render';
import {
  testArrowUpAndHomeBehavior,
  testCoreDismissibleMenuBehavior,
} from '@web/testing/shared/dismissible-menu-contract/dismissible-menu-contract';
import { useCallback, useRef } from 'react';

import { useDismissibleMenu } from './use-dismissible-menu';

const Harness = () => {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const getTrigger = useCallback(() => triggerRef.current, []);
  const getPanel = useCallback(() => panelRef.current, []);

  const { open, toggle } = useDismissibleMenu({ getTrigger, getPanel });

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

const HarnessNoTrap = () => {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const getTrigger = useCallback(() => triggerRef.current, []);
  const getPanel = useCallback(() => panelRef.current, []);

  const { open, toggle } = useDismissibleMenu({
    getTrigger,
    getPanel,
    trapFocus: false,
  });

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
      <button type="button">after panel</button>
    </div>
  );
};

const HarnessCloseOnFocusOut = () => {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const getTrigger = useCallback(() => triggerRef.current, []);
  const getPanel = useCallback(() => panelRef.current, []);

  const { open, toggle } = useDismissibleMenu({
    getTrigger,
    getPanel,
    trapFocus: false,
    closeOnFocusOut: true,
  });

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
      <button type="button">after panel</button>
    </div>
  );
};

const HarnessWithContainer = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const getTrigger = useCallback(() => triggerRef.current, []);
  const getPanel = useCallback(() => panelRef.current, []);
  const getContainer = useCallback(() => containerRef.current, []);

  const { open, toggle } = useDismissibleMenu({
    getTrigger,
    getPanel,
    getContainer,
  });

  return (
    <div ref={containerRef}>
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
      </div>
      <button type="button">sibling action</button>
    </div>
  );
};

const setup = customRender(Harness, {});

const getTrigger = () => screen.getByRole('button', { name: 'trigger' });

describe(useDismissibleMenu, () => {
  beforeEach(() => {
    setup();
  });

  testCoreDismissibleMenuBehavior();
  testArrowUpAndHomeBehavior();

  it('reverse-traps Shift+Tab, wrapping focus from the first item to the last', async () => {
    const user = userEvent.setup();
    await user.click(getTrigger());

    const first = screen.getByRole('button', { name: 'first' });
    const last = screen.getByRole('button', { name: 'second' });
    first.focus();

    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });

    expect(document.activeElement).toBe(last);
  });

  it('closes on a pointer-down on a sibling element outside the trigger/panel when no `getContainer` is given (narrow scoping, e.g. `usePopover`)', async () => {
    const user = userEvent.setup();
    const trigger = getTrigger();
    await user.click(trigger);

    const sibling = document.createElement('button');
    sibling.textContent = 'sibling';
    document.body.append(sibling);

    fireEvent.mouseDown(sibling);

    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    sibling.remove();
  });
});

describe(`${useDismissibleMenu.name} with trapFocus: false`, () => {
  const setupNoTrap = customRender(HarnessNoTrap, {});

  beforeEach(() => {
    setupNoTrap();
  });

  it('does not trap Tab — tabbing from the last item moves focus out of the panel instead of wrapping to the first', async () => {
    const user = userEvent.setup();
    await user.click(getTrigger());

    const last = screen.getByRole('button', { name: 'second' });
    last.focus();

    await user.tab();

    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: 'after panel' }),
    );
  });

  it('does not reverse-trap Shift+Tab — tabbing back from the first item moves focus to the trigger instead of wrapping to the last', async () => {
    const user = userEvent.setup();
    const trigger = getTrigger();
    await user.click(trigger);

    const first = screen.getByRole('button', { name: 'first' });
    first.focus();

    await user.tab({ shift: true });

    expect(document.activeElement).toBe(trigger);
  });

  it('does not move focus on ArrowDown/ArrowUp/Home/End', async () => {
    const user = userEvent.setup();
    await user.click(getTrigger());

    const first = screen.getByRole('button', { name: 'first' });
    first.focus();

    fireEvent.keyDown(document, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(first);

    fireEvent.keyDown(document, { key: 'ArrowUp' });
    expect(document.activeElement).toBe(first);

    fireEvent.keyDown(document, { key: 'Home' });
    expect(document.activeElement).toBe(first);

    fireEvent.keyDown(document, { key: 'End' });
    expect(document.activeElement).toBe(first);
  });

  it('still closes on Escape and returns focus to the trigger', async () => {
    const user = userEvent.setup();
    const trigger = getTrigger();
    await user.click(trigger);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(document.activeElement).toBe(trigger);
  });

  it('still closes on an outside pointer-down and returns focus to the trigger', async () => {
    const user = userEvent.setup();
    const trigger = getTrigger();
    await user.click(trigger);

    fireEvent.mouseDown(document.body);

    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(document.activeElement).toBe(trigger);
  });

  it('with the default closeOnFocusOut (false), stays open when Tab carries focus past the last item and out of the panel', async () => {
    const user = userEvent.setup();
    const trigger = getTrigger();
    await user.click(trigger);

    const last = screen.getByRole('button', { name: 'second' });
    last.focus();

    await user.tab();

    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: 'after panel' }),
    );
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });
});

describe(`${useDismissibleMenu.name} with closeOnFocusOut: true`, () => {
  const setupCloseOnFocusOut = customRender(HarnessCloseOnFocusOut, {});

  beforeEach(() => {
    setupCloseOnFocusOut();
  });

  it('closes when Tab carries focus past the last item, leaving focus on the element it landed on instead of forcing it back to the trigger', async () => {
    const user = userEvent.setup();
    const trigger = getTrigger();
    await user.click(trigger);

    const last = screen.getByRole('button', { name: 'second' });
    last.focus();

    await user.tab();

    const afterPanel = screen.getByRole('button', { name: 'after panel' });
    expect(document.activeElement).toBe(afterPanel);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes when focus moves to an arbitrary element outside the trigger/panel', () => {
    const trigger = getTrigger();
    fireEvent.click(trigger);

    const first = screen.getByRole('button', { name: 'first' });
    first.focus();

    const outside = document.createElement('button');
    document.body.append(outside);

    fireEvent.focusOut(first, { relatedTarget: outside });

    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    outside.remove();
  });

  it('stays open when focus moves within the panel', () => {
    const trigger = getTrigger();
    fireEvent.click(trigger);

    const first = screen.getByRole('button', { name: 'first' });
    const last = screen.getByRole('button', { name: 'second' });
    first.focus();

    fireEvent.focusOut(first, { relatedTarget: last });

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('stays open when focus moves back to the trigger', () => {
    const trigger = getTrigger();
    fireEvent.click(trigger);

    const first = screen.getByRole('button', { name: 'first' });
    first.focus();

    fireEvent.focusOut(first, { relatedTarget: trigger });

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('stays open on the transient relatedTarget === null blur', () => {
    const trigger = getTrigger();
    fireEvent.click(trigger);

    const first = screen.getByRole('button', { name: 'first' });
    first.focus();

    fireEvent.focusOut(first, { relatedTarget: null });

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('still closes on Escape and returns focus to the trigger', async () => {
    const user = userEvent.setup();
    const trigger = getTrigger();
    await user.click(trigger);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(document.activeElement).toBe(trigger);
  });

  it('still closes on an outside pointer-down and returns focus to the trigger', async () => {
    const user = userEvent.setup();
    const trigger = getTrigger();
    await user.click(trigger);

    fireEvent.mouseDown(document.body);

    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(document.activeElement).toBe(trigger);
  });
});

describe(`${useDismissibleMenu.name} with getContainer`, () => {
  const setupWithContainer = customRender(HarnessWithContainer, {});

  beforeEach(() => {
    setupWithContainer();
  });

  it('stays open on a pointer-down on a sibling element inside the container but outside the trigger/panel (e.g. the actions slot)', async () => {
    const user = userEvent.setup();
    const trigger = getTrigger();
    await user.click(trigger);

    fireEvent.mouseDown(screen.getByRole('button', { name: 'sibling action' }));

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('still closes on a pointer-down outside the container entirely', async () => {
    const user = userEvent.setup();
    const trigger = getTrigger();
    await user.click(trigger);

    fireEvent.mouseDown(document.body);

    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });
});
