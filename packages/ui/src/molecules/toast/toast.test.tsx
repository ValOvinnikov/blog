import { TOAST_TYPE } from '@blog/config';
import { customRender, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';
import userEvent from '@testing-library/user-event';

import { Toast } from './toast';

faker.seed(123);

const command = faker.hacker.noun();
const state = faker.hacker.ingverb();
const message = faker.lorem.sentence();
const dismissLabel = faker.lorem.words(2);

const setup = customRender(Toast, {
  type: TOAST_TYPE.SUCCESS,
  command,
  state,
  message,
  dismissLabel,
  onDismiss: vi.fn(),
  phase: 'visible',
});

describe(`<${Toast.name}/>`, () => {
  it('renders the command, state, and message', () => {
    setup();
    expect(
      screen.getByText((_, el) => el?.textContent === `${command} · ${state}`),
    ).toBeVisible();
    expect(screen.getByText(message)).toBeVisible();
  });

  it('renders as a polite status region for success/info/warning', () => {
    setup({ type: TOAST_TYPE.WARNING });
    const region = screen.getByRole('status');
    expect(region).toHaveAttribute('aria-live', 'polite');
  });

  it('renders as an assertive alert region for error', () => {
    setup({ type: TOAST_TYPE.ERROR });
    const region = screen.getByRole('alert');
    expect(region).toHaveAttribute('aria-live', 'assertive');
  });

  it('calls onDismiss when the dismiss button is clicked', async () => {
    const onDismiss = vi.fn();
    setup({ onDismiss });
    await userEvent.click(screen.getByRole('button', { name: dismissLabel }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('renders the dismiss button using the close icon, not a raw glyph', () => {
    setup();
    const dismissButton = screen.getByRole('button', { name: dismissLabel });
    expect(screen.getByTestId('toast-dismiss-icon')).toBeInTheDocument();
    expect(dismissButton).not.toHaveTextContent('✕');
  });

  it('renders the relative time when provided', () => {
    setup({ time: 'just now' });
    expect(screen.getByText('just now')).toBeVisible();
  });

  it('renders no action row when action is omitted', () => {
    setup();
    expect(screen.queryAllByRole('button')).toHaveLength(1);
  });

  it('renders an action button and calls onAct when clicked', async () => {
    const onAct = vi.fn();
    const label = faker.word.verb();
    setup({ action: { label, onAct } });

    const actionButton = screen.getByRole('button', { name: label });
    await userEvent.click(actionButton);

    expect(onAct).toHaveBeenCalledTimes(1);
  });

  it('renders the action key hint when provided', () => {
    setup({
      action: { label: 'undo', onAct: vi.fn(), keyHint: '⌘Z' },
    });
    expect(screen.getByText('⌘Z')).toBeVisible();
  });

  it('renders a timer bar when durationMs is set', () => {
    setup({ durationMs: 3600, dataTestId: 'toast' });
    expect(screen.getByTestId('toast-timer')).toBeInTheDocument();
  });

  it('renders no timer bar when durationMs is undefined (sticky)', () => {
    setup({ durationMs: undefined, dataTestId: 'toast' });
    expect(screen.queryByTestId('toast-timer')).not.toBeInTheDocument();
  });

  it('renders a decorative spinner when isLoading is true', () => {
    setup({ isLoading: true });
    const spinner = screen.getByTestId('toast-spinner');
    expect(spinner).toBeVisible();
    expect(spinner).toHaveAttribute('aria-hidden', 'true');
  });

  it('exposes a single status region when isLoading is true, not a nested one from the spinner', () => {
    setup({ isLoading: true });
    expect(screen.queryAllByRole('status')).toHaveLength(1);
  });

  it('forwards data-testid to the root element', () => {
    setup({ dataTestId: 'toast' });
    expect(screen.getByTestId('toast')).toBeVisible();
  });

  describe('plain mode', () => {
    it('renders the message but not the command/state chip', () => {
      setup({ isPlain: true });
      expect(screen.getByText(message)).toBeVisible();
      expect(
        screen.queryByText(
          (_, el) => el?.textContent === `${command} · ${state}`,
        ),
      ).not.toBeInTheDocument();
      expect(screen.queryByText(command)).not.toBeInTheDocument();
      expect(screen.queryByText(state)).not.toBeInTheDocument();
    });

    it('still calls onDismiss when the dismiss button is clicked', async () => {
      const onDismiss = vi.fn();
      setup({ isPlain: true, onDismiss });
      await userEvent.click(screen.getByRole('button', { name: dismissLabel }));
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('still renders the relative time when provided', () => {
      setup({ isPlain: true, time: 'just now' });
      expect(screen.getByText('just now')).toBeVisible();
    });

    it('still renders an action button and calls onAct when clicked', async () => {
      const onAct = vi.fn();
      const label = faker.word.verb();
      setup({ isPlain: true, action: { label, onAct } });

      const actionButton = screen.getByRole('button', { name: label });
      await userEvent.click(actionButton);

      expect(onAct).toHaveBeenCalledTimes(1);
    });
  });
});
