import { TOAST_TYPE } from '@blog/config';
import { customRender, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';
import userEvent from '@testing-library/user-event';

import { Toast } from './toast';

faker.seed(123);

const title = faker.word.noun();
const message = faker.lorem.sentence();
const dismissLabel = faker.lorem.words(2);

const setup = customRender(Toast, {
  type: TOAST_TYPE.SUCCESS,
  title,
  message,
  dismissLabel,
  onDismiss: vi.fn(),
  phase: 'visible',
});

describe(`<${Toast.name}/>`, () => {
  it('renders the title and message', () => {
    setup();
    expect(screen.getByText(title)).toBeVisible();
    expect(screen.getByText(message)).toBeVisible();
  });

  it('renders the message alone when title is omitted', () => {
    setup({ title: undefined });
    expect(screen.getByText(message)).toBeVisible();
  });

  it('renders the type glyph using the Icon component, not a raw glyph span', () => {
    setup();
    expect(screen.getByTestId('toast-icon')).toBeInTheDocument();
    expect(screen.queryByText('✓')).not.toBeInTheDocument();
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

  it('renders a decorative spinner instead of the icon when isLoading is true', () => {
    setup({ isLoading: true });
    const spinner = screen.getByTestId('toast-spinner');
    expect(spinner).toBeVisible();
    expect(spinner).toHaveAttribute('aria-hidden', 'true');
    expect(screen.queryByTestId('toast-icon')).not.toBeInTheDocument();
  });

  it('exposes a single status region when isLoading is true, not a nested one from the spinner', () => {
    setup({ isLoading: true });
    expect(screen.queryAllByRole('status')).toHaveLength(1);
  });

  it('forwards data-testid to the root element', () => {
    setup({ dataTestId: 'toast' });
    expect(screen.getByTestId('toast')).toBeVisible();
  });
});
