import userEvent, { type UserEvent } from '@testing-library/user-event';
import { customRender, fireEvent, screen } from '@web/testing/custom-render';
import {
  expectMenuClosed,
  expectMenuOpen,
  MENU_FIRST_ITEM_NAME,
  MENU_LAST_ITEM_NAME,
  MENU_SIBLING_ACTION_NAME,
  MENU_TRIGGER_NAME,
  testArrowUpAndHomeBehavior,
  testCoreDismissibleMenuBehavior,
} from '@web/testing/hooks/use-dismissible-menu/contract';
import { useCallback, useRef } from 'react';

import {
  type TDismissibleMenuAccessors,
  useDismissibleMenu,
} from './use-dismissible-menu';

type THarnessProps = Pick<
  TDismissibleMenuAccessors,
  'trapFocus' | 'closeOnFocusOut'
> & { hasContainer?: boolean };

const Harness = ({
  trapFocus,
  closeOnFocusOut,
  hasContainer,
}: THarnessProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const getTrigger = useCallback(() => triggerRef.current, []);
  const getPanel = useCallback(() => panelRef.current, []);
  const getContainer = useCallback(() => containerRef.current, []);

  const { open, toggle } = useDismissibleMenu({
    getTrigger,
    getPanel,
    getContainer: hasContainer ? getContainer : undefined,
    trapFocus,
    closeOnFocusOut,
  });

  return (
    <div ref={containerRef}>
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
        <button type="button">{MENU_LAST_ITEM_NAME}</button>
      </div>
      <button type="button">{MENU_SIBLING_ACTION_NAME}</button>
    </div>
  );
};

const setup = customRender(Harness, {});

describe(useDismissibleMenu, () => {
  let user: UserEvent;
  const getUser = () => user;

  beforeEach(() => {
    user = userEvent.setup();
  });

  describe('with the default options', () => {
    beforeEach(() => {
      setup();
    });

    testCoreDismissibleMenuBehavior(getUser);
    testArrowUpAndHomeBehavior(getUser);

    it('wraps Shift+Tab from the first item to the last', async () => {
      const trigger = screen.getByRole('button', { name: MENU_TRIGGER_NAME });
      await user.click(trigger);
      const lastItem = screen.getByRole('button', {
        name: MENU_LAST_ITEM_NAME,
      });

      await user.tab({ shift: true });

      expect(lastItem).toHaveFocus();
    });

    it('closes on a pointer-down on an element beside the trigger and panel', async () => {
      const trigger = screen.getByRole('button', { name: MENU_TRIGGER_NAME });
      await user.click(trigger);
      const siblingAction = screen.getByRole('button', {
        name: MENU_SIBLING_ACTION_NAME,
      });

      fireEvent.mouseDown(siblingAction);

      expectMenuClosed(trigger);
    });
  });

  describe('with a container', () => {
    beforeEach(() => {
      setup({ hasContainer: true });
    });

    it('stays open on a pointer-down inside the container beside the panel', async () => {
      const trigger = screen.getByRole('button', { name: MENU_TRIGGER_NAME });
      await user.click(trigger);
      const siblingAction = screen.getByRole('button', {
        name: MENU_SIBLING_ACTION_NAME,
      });

      fireEvent.mouseDown(siblingAction);

      expectMenuOpen(trigger);
    });

    it('closes on a pointer-down outside the container', async () => {
      const trigger = screen.getByRole('button', { name: MENU_TRIGGER_NAME });
      await user.click(trigger);

      fireEvent.mouseDown(document.body);

      expectMenuClosed(trigger);
    });
  });

  describe('without focus trapping', () => {
    beforeEach(() => {
      setup({ trapFocus: false });
    });

    it('lets Tab leave the panel from the last item', async () => {
      const trigger = screen.getByRole('button', { name: MENU_TRIGGER_NAME });
      await user.click(trigger);
      const lastItem = screen.getByRole('button', {
        name: MENU_LAST_ITEM_NAME,
      });
      await user.click(lastItem);

      await user.tab();

      const siblingAction = screen.getByRole('button', {
        name: MENU_SIBLING_ACTION_NAME,
      });
      expect(siblingAction).toHaveFocus();
      expectMenuOpen(trigger);
    });

    it('lets Shift+Tab leave the panel from the first item', async () => {
      const trigger = screen.getByRole('button', { name: MENU_TRIGGER_NAME });
      await user.click(trigger);

      await user.tab({ shift: true });

      expect(trigger).toHaveFocus();
    });

    it.each(['{ArrowDown}', '{ArrowUp}', '{Home}', '{End}'])(
      'leaves focus on the first item for %s',
      async (key) => {
        const trigger = screen.getByRole('button', { name: MENU_TRIGGER_NAME });
        await user.click(trigger);
        const firstItem = screen.getByRole('button', {
          name: MENU_FIRST_ITEM_NAME,
        });

        await user.keyboard(key);

        expect(firstItem).toHaveFocus();
      },
    );
  });

  describe('closing on focus out', () => {
    beforeEach(() => {
      setup({ trapFocus: false, closeOnFocusOut: true });
    });

    it('closes when Tab carries focus out of the panel and keeps focus there', async () => {
      const trigger = screen.getByRole('button', { name: MENU_TRIGGER_NAME });
      await user.click(trigger);
      const lastItem = screen.getByRole('button', {
        name: MENU_LAST_ITEM_NAME,
      });
      await user.click(lastItem);

      await user.tab();

      const siblingAction = screen.getByRole('button', {
        name: MENU_SIBLING_ACTION_NAME,
      });
      expect(siblingAction).toHaveFocus();
      expectMenuClosed(trigger);
    });

    it('stays open when focus moves within the panel', async () => {
      const trigger = screen.getByRole('button', { name: MENU_TRIGGER_NAME });
      await user.click(trigger);

      await user.tab();

      const lastItem = screen.getByRole('button', {
        name: MENU_LAST_ITEM_NAME,
      });
      expect(lastItem).toHaveFocus();
      expectMenuOpen(trigger);
    });

    it('stays open when focus moves back to the trigger', async () => {
      const trigger = screen.getByRole('button', { name: MENU_TRIGGER_NAME });
      await user.click(trigger);

      await user.tab({ shift: true });

      expect(trigger).toHaveFocus();
      expectMenuOpen(trigger);
    });

    it('stays open on a blur that has no related target', async () => {
      const trigger = screen.getByRole('button', { name: MENU_TRIGGER_NAME });
      await user.click(trigger);
      const firstItem = screen.getByRole('button', {
        name: MENU_FIRST_ITEM_NAME,
      });

      fireEvent.focusOut(firstItem, { relatedTarget: null });

      expectMenuOpen(trigger);
    });
  });

  describe.each([
    { title: 'with focus trapping off', options: { trapFocus: false } },
    {
      title: 'with focus-out closing on',
      options: { trapFocus: false, closeOnFocusOut: true },
    },
  ])('dismissal $title', ({ options }) => {
    beforeEach(() => {
      setup(options);
    });

    it('closes on Escape and returns focus to the trigger', async () => {
      const trigger = screen.getByRole('button', { name: MENU_TRIGGER_NAME });
      await user.click(trigger);

      await user.keyboard('{Escape}');

      expectMenuClosed(trigger);
      expect(trigger).toHaveFocus();
    });

    it('closes on an outside pointer-down and returns focus to the trigger', async () => {
      const trigger = screen.getByRole('button', { name: MENU_TRIGGER_NAME });
      await user.click(trigger);

      fireEvent.mouseDown(document.body);

      expectMenuClosed(trigger);
      expect(trigger).toHaveFocus();
    });
  });
});
