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
} from '@web/testing/shared/dismissible-menu-contract/dismissible-menu-contract';
import {
  KEY_ARROW_DOWN,
  KEY_ARROW_UP,
  KEY_END,
  KEY_ESCAPE,
  KEY_HOME,
} from '@web/testing/shared/keyboard/constants';
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
  let trigger: HTMLElement;
  const getUser = () => user;

  const openMenu = async () => {
    trigger = screen.getByRole('button', { name: MENU_TRIGGER_NAME });
    await user.click(trigger);
  };

  beforeEach(() => {
    user = userEvent.setup();
  });

  describe('with the default options', () => {
    beforeEach(() => {
      setup();
    });

    testCoreDismissibleMenuBehavior(getUser);
    testArrowUpAndHomeBehavior(getUser);

    describe('once opened', () => {
      beforeEach(async () => {
        await openMenu();
      });

      it('wraps Shift+Tab from the first item to the last', async () => {
        const lastItem = screen.getByRole('button', {
          name: MENU_LAST_ITEM_NAME,
        });

        await user.tab({ shift: true });

        expect(lastItem).toHaveFocus();
      });

      it('closes on a pointer-down on an element beside the trigger and panel', () => {
        const siblingAction = screen.getByRole('button', {
          name: MENU_SIBLING_ACTION_NAME,
        });

        fireEvent.mouseDown(siblingAction);

        expectMenuClosed(trigger);
      });
    });
  });

  describe('with a container, once opened', () => {
    beforeEach(async () => {
      setup({ hasContainer: true });
      await openMenu();
    });

    it('stays open on a pointer-down inside the container beside the panel', () => {
      const siblingAction = screen.getByRole('button', {
        name: MENU_SIBLING_ACTION_NAME,
      });

      fireEvent.mouseDown(siblingAction);

      expectMenuOpen(trigger);
    });

    it('closes on a pointer-down outside the container', () => {
      fireEvent.mouseDown(document.body);

      expectMenuClosed(trigger);
    });
  });

  describe('without focus trapping, once opened', () => {
    beforeEach(async () => {
      setup({ trapFocus: false });
      await openMenu();
    });

    it('lets Tab leave the panel from the last item', async () => {
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
      await user.tab({ shift: true });

      expect(trigger).toHaveFocus();
    });

    it.each([KEY_ARROW_DOWN, KEY_ARROW_UP, KEY_HOME, KEY_END])(
      'leaves focus on the first item for %s',
      async (key) => {
        const firstItem = screen.getByRole('button', {
          name: MENU_FIRST_ITEM_NAME,
        });

        await user.keyboard(key);

        expect(firstItem).toHaveFocus();
      },
    );
  });

  describe('closing on focus out, once opened', () => {
    beforeEach(async () => {
      setup({ trapFocus: false, closeOnFocusOut: true });
      await openMenu();
    });

    it('closes when Tab carries focus out of the panel and keeps focus there', async () => {
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
      await user.tab();

      const lastItem = screen.getByRole('button', {
        name: MENU_LAST_ITEM_NAME,
      });
      expect(lastItem).toHaveFocus();
      expectMenuOpen(trigger);
    });

    it('stays open when focus moves back to the trigger', async () => {
      await user.tab({ shift: true });

      expect(trigger).toHaveFocus();
      expectMenuOpen(trigger);
    });

    it('stays open on a blur that has no related target', () => {
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
  ])('dismissal $title, once opened', ({ options }) => {
    beforeEach(async () => {
      setup(options);
      await openMenu();
    });

    it('closes on Escape and returns focus to the trigger', async () => {
      await user.keyboard(KEY_ESCAPE);

      expectMenuClosed(trigger);
      expect(trigger).toHaveFocus();
    });

    it('closes on an outside pointer-down and returns focus to the trigger', () => {
      fireEvent.mouseDown(document.body);

      expectMenuClosed(trigger);
      expect(trigger).toHaveFocus();
    });
  });
});
