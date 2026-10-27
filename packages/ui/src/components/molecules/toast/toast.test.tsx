import { TOAST_TYPE } from '@blog/config';
import { customRender, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { Toast } from './toast';

faker.seed(123);

const TOAST_TEST_ID = 'toast';
const TOAST_TIMER_TEST_ID = 'toast-timer';
const TOAST_ICON_TEST_ID = 'toast-icon';
const TOAST_SPINNER_TEST_ID = 'toast-spinner';
const MOCK_TITLE = faker.word.noun();
const MOCK_MESSAGE = faker.lorem.sentence();
const MOCK_DISMISS_LABEL = faker.lorem.words(2);
const MOCK_TIME = faker.lorem.words(2);
const MOCK_ACTION_LABEL = faker.word.verb();
const MOCK_KEY_HINT = faker.lorem.word();
const MOCK_DURATION_MS = faker.number.int({ min: 1000, max: 9000 });

const setup = customRender(Toast, {
  type: TOAST_TYPE.SUCCESS,
  title: MOCK_TITLE,
  message: MOCK_MESSAGE,
  dismissLabel: MOCK_DISMISS_LABEL,
  onDismiss: vi.fn(),
  phase: 'visible',
});

describe(`<${Toast.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  describe('with the default props', () => {
    beforeEach(() => {
      setup();
    });

    it('renders the title and message', () => {
      const title = screen.getByText(MOCK_TITLE);
      const message = screen.getByText(MOCK_MESSAGE);

      expect(title).toBeVisible();
      expect(message).toBeVisible();
    });

    it('renders the type icon', () => {
      const icon = screen.getByTestId(TOAST_ICON_TEST_ID);

      expect(icon).toBeVisible();
    });

    it('renders no action button', () => {
      const buttons = screen.getAllByRole('button');

      expect(buttons).toHaveLength(1);
    });
  });

  it('renders the message alone when title is omitted', () => {
    setup({ title: undefined });

    const message = screen.getByText(MOCK_MESSAGE);
    const title = screen.queryByText(MOCK_TITLE);

    expect(message).toBeVisible();
    expect(title).not.toBeInTheDocument();
  });

  it('announces success, info and warning politely as a status', () => {
    setup({ type: TOAST_TYPE.WARNING });

    const region = screen.getByRole('status');

    expect(region).toHaveAttribute('aria-live', 'polite');
  });

  it('announces an error assertively as an alert', () => {
    setup({ type: TOAST_TYPE.ERROR });

    const region = screen.getByRole('alert');

    expect(region).toHaveAttribute('aria-live', 'assertive');
  });

  it('calls onDismiss when the dismiss button is clicked', async () => {
    const onDismiss = vi.fn();
    setup({ onDismiss });

    const dismissButton = screen.getByRole('button', {
      name: MOCK_DISMISS_LABEL,
    });
    await user.click(dismissButton);

    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it('renders the relative time', () => {
    setup({ time: MOCK_TIME });

    const time = screen.getByText(MOCK_TIME);

    expect(time).toBeVisible();
  });

  it('renders an action button and calls onAct when clicked', async () => {
    const onAct = vi.fn();
    setup({ action: { label: MOCK_ACTION_LABEL, onAct } });

    const actionButton = screen.getByRole('button', {
      name: MOCK_ACTION_LABEL,
    });
    await user.click(actionButton);

    expect(onAct).toHaveBeenCalledOnce();
  });

  it('renders the action key hint', () => {
    setup({
      action: {
        label: MOCK_ACTION_LABEL,
        onAct: vi.fn(),
        keyHint: MOCK_KEY_HINT,
      },
    });

    const keyHint = screen.getByText(MOCK_KEY_HINT);

    expect(keyHint).toBeVisible();
  });

  it('renders a timer bar when durationMs is set', () => {
    setup({ durationMs: MOCK_DURATION_MS, dataTestId: TOAST_TEST_ID });

    const timer = screen.getByTestId(TOAST_TIMER_TEST_ID);

    expect(timer).toBeVisible();
  });

  it('renders no timer bar for a sticky toast', () => {
    setup({ durationMs: undefined, dataTestId: TOAST_TEST_ID });

    const timer = screen.queryByTestId(TOAST_TIMER_TEST_ID);

    expect(timer).not.toBeInTheDocument();
  });

  describe('while loading', () => {
    beforeEach(() => {
      setup({ isLoading: true });
    });

    it('renders a decorative spinner instead of the icon', () => {
      const spinner = screen.getByTestId(TOAST_SPINNER_TEST_ID);
      const icon = screen.queryByTestId(TOAST_ICON_TEST_ID);

      expect(spinner).toBeVisible();
      expect(spinner).toHaveAttribute('aria-hidden', 'true');
      expect(icon).not.toBeInTheDocument();
    });

    it('exposes a single status region, none nested from the spinner', () => {
      const regions = screen.getAllByRole('status');

      expect(regions).toHaveLength(1);
    });
  });
});
