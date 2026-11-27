import { faker } from '@faker-js/faker';
import { ARIA_ATTRIBUTE } from '@platform/constants/aria-attribute';
import {
  customRender,
  renderWithIntl,
  screen,
} from '@platform/testing/custom-render';
import { USER_EVENT_KEY } from '@platform/testing/keyboard';
import { findServerEventHandlers } from '@platform/testing/server-event-handlers';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import type { Mock } from 'vitest';

import { Button } from './button';

faker.seed(5995);

const MOCK_LABEL = faker.lorem.word();
const MOCK_PENDING_LABEL = faker.lorem.word();
const MOCK_REASON_ID = faker.string.alpha(8);
const MOCK_REASON = faker.lorem.sentence();

const setup = customRender(Button, { children: MOCK_LABEL });

describe(`<${Button.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  describe('with the default props', () => {
    let button: HTMLElement;

    beforeEach(() => {
      setup();
      button = screen.getByRole('button', { name: MOCK_LABEL });
    });

    it('renders its children as the accessible name', () => {
      expect(button).toBeVisible();
    });

    it('is enabled and not busy when not pending', () => {
      expect(button).toBeEnabled();
      expect(button).toHaveAttribute(ARIA_ATTRIBUTE.BUSY, 'false');
    });
  });

  describe('with a click handler', () => {
    let handleClick: Mock<() => void>;

    beforeEach(() => {
      handleClick = vi.fn();
    });

    it('calls the click handler when enabled', async () => {
      setup({ onClick: handleClick });

      const button = screen.getByRole('button', { name: MOCK_LABEL });
      await user.click(button);

      expect(handleClick).toHaveBeenCalledOnce();
    });

    it('renders disabled and ignores clicks', async () => {
      setup({ isDisabled: true, onClick: handleClick });

      const button = screen.getByRole('button', { name: MOCK_LABEL });
      await user.click(button);

      expect(button).toBeDisabled();
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('stays focusable but ignores clicks and Enter when aria-disabled', async () => {
      setup({ isAriaDisabled: true, onClick: handleClick });

      const button = screen.getByRole('button', { name: MOCK_LABEL });

      expect(button).toHaveAttribute(ARIA_ATTRIBUTE.DISABLED, 'true');
      expect(button).not.toBeDisabled();

      await user.tab();

      expect(button).toHaveFocus();

      await user.click(button);
      await user.keyboard(USER_EVENT_KEY.ENTER);

      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  it('passes no event handler from a Server Component when given no onClick', () => {
    const handlers = findServerEventHandlers(
      <Button isDisabled={true}>{MOCK_LABEL}</Button>,
    );

    expect(handlers).toEqual([]);
  });

  it('keeps a decorative arrow out of the accessible name', () => {
    setup({ hasArrow: true });

    const button = screen.getByRole('button', { name: MOCK_LABEL });

    expect(button).toBeVisible();
  });

  it('is described by an element elsewhere on the page', () => {
    renderWithIntl(
      <>
        <Button isDisabled={true} aria-describedby={MOCK_REASON_ID}>
          {MOCK_LABEL}
        </Button>
        <p id={MOCK_REASON_ID}>{MOCK_REASON}</p>
      </>,
    );

    const button = screen.getByRole('button', { name: MOCK_LABEL });

    expect(button).toHaveAccessibleDescription(MOCK_REASON);
  });

  describe('pending', () => {
    describe('without a pending label', () => {
      beforeEach(() => {
        setup({ isPending: true });
      });

      it('stays enabled, marked busy and aria-disabled', () => {
        const button = screen.getByRole('button', { name: MOCK_LABEL });

        expect(button).toBeEnabled();
        expect(button).toHaveAttribute(ARIA_ATTRIBUTE.BUSY, 'true');
        expect(button).toHaveAttribute(ARIA_ATTRIBUTE.DISABLED, 'true');
      });

      it('renders no status region without a pending label', () => {
        const status = screen.queryByRole('status');

        expect(status).not.toBeInTheDocument();
      });
    });

    it('keeps focus when it turns busy', async () => {
      const { rerender } = setup({ pendingLabel: MOCK_PENDING_LABEL });

      await user.tab();

      rerender(
        <Button isPending={true} pendingLabel={MOCK_PENDING_LABEL}>
          {MOCK_LABEL}
        </Button>,
      );

      const button = screen.getByRole('button', { name: MOCK_PENDING_LABEL });

      expect(button).toHaveFocus();
    });

    it('does not submit its form', async () => {
      const handleSubmit = vi.fn();
      renderWithIntl(
        <form onSubmit={handleSubmit}>
          <Button type="submit" isPending={true}>
            {MOCK_LABEL}
          </Button>
        </form>,
      );

      const button = screen.getByRole('button', { name: MOCK_LABEL });
      await user.click(button);

      expect(handleSubmit).not.toHaveBeenCalled();
    });

    it('ignores clicks', async () => {
      const handleClick = vi.fn();
      setup({ isPending: true, onClick: handleClick });

      const button = screen.getByRole('button', { name: MOCK_LABEL });
      await user.click(button);

      expect(handleClick).not.toHaveBeenCalled();
    });

    it('shows the pending label in place of its children', () => {
      setup({ isPending: true, pendingLabel: MOCK_PENDING_LABEL });

      const pendingButton = screen.getByRole('button', {
        name: MOCK_PENDING_LABEL,
      });
      const idleButton = screen.queryByRole('button', { name: MOCK_LABEL });

      expect(pendingButton).toBeVisible();
      expect(idleButton).not.toBeInTheDocument();
    });

    it('takes its name from its children again once idle', () => {
      const { rerender } = setup({
        isPending: true,
        pendingLabel: MOCK_PENDING_LABEL,
      });

      rerender(<Button pendingLabel={MOCK_PENDING_LABEL}>{MOCK_LABEL}</Button>);

      const button = screen.getByRole('button', { name: MOCK_LABEL });

      expect(button).toBeEnabled();
    });
  });

  describe('status region', () => {
    it('mounts an empty polite status region before it is pending', () => {
      setup({ pendingLabel: MOCK_PENDING_LABEL });

      const status = screen.getByRole('status');

      expect(status).toHaveAttribute(ARIA_ATTRIBUTE.LIVE, 'polite');
      expect(status).toHaveTextContent('');
    });

    it('announces the pending label in the region that already existed', () => {
      const { rerender } = setup({ pendingLabel: MOCK_PENDING_LABEL });

      const status = screen.getByRole('status');

      rerender(
        <Button isPending={true} pendingLabel={MOCK_PENDING_LABEL}>
          {MOCK_LABEL}
        </Button>,
      );

      const pendingStatus = screen.getByRole('status');

      expect(pendingStatus).toBe(status);
      expect(status).toHaveTextContent(MOCK_PENDING_LABEL);
    });
  });
});
