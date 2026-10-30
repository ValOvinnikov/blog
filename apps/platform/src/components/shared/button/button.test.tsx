import { faker } from '@faker-js/faker';
import { ARIA_DISABLED } from '@platform/testing/aria';
import {
  customRender,
  renderWithIntl,
  screen,
} from '@platform/testing/custom-render';
import { findServerEventHandlers } from '@platform/testing/server-event-handlers';
import userEvent, { type UserEvent } from '@testing-library/user-event';

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

  it('renders its children as the accessible name', () => {
    setup();

    const button = screen.getByRole('button', { name: MOCK_LABEL });

    expect(button).toBeVisible();
  });

  it('calls the click handler when enabled', async () => {
    const handleClick = vi.fn();
    setup({ onClick: handleClick });

    const button = screen.getByRole('button', { name: MOCK_LABEL });
    await user.click(button);

    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('renders disabled and ignores clicks', async () => {
    const handleClick = vi.fn();
    setup({ isDisabled: true, onClick: handleClick });

    const button = screen.getByRole('button', { name: MOCK_LABEL });
    await user.click(button);

    expect(button).toBeDisabled();
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('passes no event handler from a Server Component when given no onClick', () => {
    const handlers = findServerEventHandlers(
      <Button isDisabled={true}>{MOCK_LABEL}</Button>,
    );

    expect(handlers).toEqual([]);
  });

  it('stays focusable but ignores clicks and Enter when aria-disabled', async () => {
    const handleClick = vi.fn();
    setup({ isAriaDisabled: true, onClick: handleClick });

    const button = screen.getByRole('button', { name: MOCK_LABEL });

    expect(button).toHaveAttribute(ARIA_DISABLED, 'true');
    expect(button).not.toBeDisabled();

    await user.tab();

    expect(button).toHaveFocus();

    await user.click(button);
    await user.keyboard('{Enter}');

    expect(handleClick).not.toHaveBeenCalled();
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

  it('is enabled and not busy when not pending', () => {
    setup();

    const button = screen.getByRole('button', { name: MOCK_LABEL });

    expect(button).toBeEnabled();
    expect(button).toHaveAttribute('aria-busy', 'false');
  });

  describe('pending', () => {
    it('stays enabled, marked busy and aria-disabled', () => {
      setup({ isPending: true });

      const button = screen.getByRole('button', { name: MOCK_LABEL });

      expect(button).toBeEnabled();
      expect(button).toHaveAttribute('aria-busy', 'true');
      expect(button).toHaveAttribute(ARIA_DISABLED, 'true');
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

    it('renders no status region without a pending label', () => {
      setup({ isPending: true });

      const status = screen.queryByRole('status');

      expect(status).not.toBeInTheDocument();
    });
  });

  describe('status region', () => {
    it('mounts an empty polite status region before it is pending', () => {
      setup({ pendingLabel: MOCK_PENDING_LABEL });

      const status = screen.getByRole('status');

      expect(status).toHaveAttribute('aria-live', 'polite');
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
