import { SITE_MESSAGES } from '@blog/config';
import { faker } from '@faker-js/faker';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import {
  act,
  customRender,
  renderHook,
  screen,
  within,
} from '@web/testing/custom-render';

import { ToastProvider, useToast } from './toast-provider';

faker.seed(6012);

const MOCK_BODY_TEXT = faker.lorem.sentence();
const MOCK_TITLE = faker.lorem.words(2);
const MOCK_SUCCESS_MESSAGE = faker.lorem.sentence();
const MOCK_ERROR_MESSAGE = faker.lorem.sentence();
const MOCK_LOADING_MESSAGE = faker.lorem.sentence();
const MOCK_ACTION_LABEL = faker.lorem.word();
const MOCK_FIRE_SUCCESS_LABEL = `fire ${faker.lorem.words(2)}`;
const MOCK_FIRE_ERROR_LABEL = `fire ${faker.lorem.words(2)}`;
const MOCK_FIRE_PROMISE_LABEL = `fire ${faker.lorem.words(2)}`;
const MOCK_SHORT_WAIT_MS = faker.number.int({ min: 500, max: 1500 });
const MOCK_HOLD_MS = faker.number.int({ min: 10_000, max: 20_000 });
const DISMISS_LABEL = SITE_MESSAGES.toastProvider.dismissLabel;

const advanceTime = (ms: number) =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });

const ToastHarness = ({ onAct }: { onAct: () => void }) => {
  const toast = useToast();

  return (
    <>
      <button
        onClick={() =>
          toast.success({
            title: MOCK_TITLE,
            message: MOCK_SUCCESS_MESSAGE,
            action: { label: MOCK_ACTION_LABEL, onAct },
          })
        }
      >
        {MOCK_FIRE_SUCCESS_LABEL}
      </button>
      <button onClick={() => toast.error({ message: MOCK_ERROR_MESSAGE })}>
        {MOCK_FIRE_ERROR_LABEL}
      </button>
      <button
        onClick={() =>
          toast.promise(Promise.resolve(), {
            loading: { message: MOCK_LOADING_MESSAGE },
            success: { message: MOCK_SUCCESS_MESSAGE },
            error: { message: MOCK_ERROR_MESSAGE },
          })
        }
      >
        {MOCK_FIRE_PROMISE_LABEL}
      </button>
    </>
  );
};

const getFireButtons = () => ({
  fireSuccessButton: screen.getByRole('button', {
    name: MOCK_FIRE_SUCCESS_LABEL,
  }),
  fireErrorButton: screen.getByRole('button', { name: MOCK_FIRE_ERROR_LABEL }),
  firePromiseButton: screen.getByRole('button', {
    name: MOCK_FIRE_PROMISE_LABEL,
  }),
});

const setup = customRender(ToastProvider, {
  children: <ToastHarness onAct={vi.fn()} />,
});

describe(`<${ToastProvider.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(0);
      return 0;
    });
    user = userEvent.setup({ delay: null });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('renders children', () => {
    setup({ children: <p>{MOCK_BODY_TEXT}</p> });

    const body = screen.getByText(MOCK_BODY_TEXT);

    expect(body).toBeVisible();
  });

  describe('with the toast harness', () => {
    let onAct: () => void;

    beforeEach(() => {
      onAct = vi.fn();
      setup({ children: <ToastHarness onAct={onAct} /> });
    });

    it('renders no toast before one is fired', () => {
      const status = screen.queryByRole('status');

      expect(status).not.toBeInTheDocument();
    });

    it('shows a fired success toast with its title and message', async () => {
      const { fireSuccessButton } = getFireButtons();
      await user.click(fireSuccessButton);

      const status = screen.getByRole('status');
      const title = within(status).getByText(MOCK_TITLE);
      const message = within(status).getByText(MOCK_SUCCESS_MESSAGE);

      expect(status).toBeVisible();
      expect(title).toBeVisible();
      expect(message).toBeVisible();
    });

    it('shows a fired error toast as an alert', async () => {
      const { fireErrorButton } = getFireButtons();
      await user.click(fireErrorButton);

      const alert = screen.getByRole('alert');
      const message = within(alert).getByText(MOCK_ERROR_MESSAGE);

      expect(alert).toBeVisible();
      expect(message).toBeVisible();
    });

    it('dismisses a toast via its close button', async () => {
      const { fireSuccessButton } = getFireButtons();
      await user.click(fireSuccessButton);
      const dismissButton = screen.getByRole('button', { name: DISMISS_LABEL });
      await user.click(dismissButton);
      await advanceTime(MOCK_SHORT_WAIT_MS);

      const message = screen.queryByText(MOCK_SUCCESS_MESSAGE);

      expect(message).not.toBeInTheDocument();
    });

    it('runs the action callback and dismisses the toast', async () => {
      const { fireSuccessButton } = getFireButtons();
      await user.click(fireSuccessButton);
      const actionButton = screen.getByRole('button', {
        name: MOCK_ACTION_LABEL,
      });
      await user.click(actionButton);
      await advanceTime(MOCK_SHORT_WAIT_MS);

      const message = screen.queryByText(MOCK_SUCCESS_MESSAGE);

      expect(onAct).toHaveBeenCalledTimes(1);
      expect(message).not.toBeInTheDocument();
    });

    it('holds a hovered toast open and dismisses it after the pointer leaves', async () => {
      const { fireSuccessButton } = getFireButtons();
      await user.click(fireSuccessButton);
      const status = screen.getByRole('status');

      await advanceTime(MOCK_SHORT_WAIT_MS);
      await user.hover(status);
      await advanceTime(MOCK_HOLD_MS);
      const heldMessage = screen.getByText(MOCK_SUCCESS_MESSAGE);

      expect(heldMessage).toBeVisible();

      await user.unhover(status);
      await advanceTime(MOCK_HOLD_MS);
      const message = screen.queryByText(MOCK_SUCCESS_MESSAGE);

      expect(message).not.toBeInTheDocument();
    });

    it('keeps a toast open after the pointer leaves while focus is inside it', async () => {
      const { fireSuccessButton } = getFireButtons();
      await user.click(fireSuccessButton);
      const status = screen.getByRole('status');
      const dismissButton = screen.getByRole('button', { name: DISMISS_LABEL });

      await user.hover(status);
      await user.tab();
      await user.tab();
      await user.tab();
      await user.unhover(status);
      await advanceTime(MOCK_HOLD_MS);
      const heldMessage = screen.getByText(MOCK_SUCCESS_MESSAGE);

      expect(dismissButton).toHaveFocus();
      expect(heldMessage).toBeVisible();

      await user.click(document.body);
      await advanceTime(MOCK_HOLD_MS);
      const message = screen.queryByText(MOCK_SUCCESS_MESSAGE);

      expect(message).not.toBeInTheDocument();
    });

    it('merges a rapid identical success toast into one with a count', async () => {
      const { fireSuccessButton } = getFireButtons();
      await user.click(fireSuccessButton);
      await user.click(fireSuccessButton);

      const statuses = screen.getAllByRole('status');
      const message = screen.getByText(`${MOCK_SUCCESS_MESSAGE} ×2`);

      expect(statuses).toHaveLength(1);
      expect(message).toBeVisible();
    });

    it('dismisses the newest toast on Escape when none is focused', async () => {
      const { fireSuccessButton, fireErrorButton } = getFireButtons();
      await user.click(fireErrorButton);
      await user.click(fireSuccessButton);

      await user.keyboard('{Escape}');
      await advanceTime(MOCK_SHORT_WAIT_MS);
      const successMessage = screen.queryByText(MOCK_SUCCESS_MESSAGE);
      const errorMessage = screen.getByText(MOCK_ERROR_MESSAGE);

      expect(successMessage).not.toBeInTheDocument();
      expect(errorMessage).toBeVisible();
    });

    it('dismisses the focused toast on Escape instead of the newest', async () => {
      const { fireSuccessButton, fireErrorButton } = getFireButtons();
      await user.click(fireErrorButton);
      await user.click(fireSuccessButton);
      const [errorDismissButton] = screen.getAllByRole('button', {
        name: DISMISS_LABEL,
      });

      await user.tab();
      await user.tab();
      await user.tab();
      expect(errorDismissButton).toHaveFocus();

      await user.keyboard('{Escape}');
      await advanceTime(MOCK_SHORT_WAIT_MS);
      const errorMessage = screen.queryByText(MOCK_ERROR_MESSAGE);
      const successMessage = screen.getByText(MOCK_SUCCESS_MESSAGE);

      expect(errorMessage).not.toBeInTheDocument();
      expect(successMessage).toBeVisible();
    });

    it('shows the resolved toast without a loading toast for a quick promise', async () => {
      const { firePromiseButton } = getFireButtons();
      await user.click(firePromiseButton);

      const status = screen.getByRole('status');
      const message = within(status).getByText(MOCK_SUCCESS_MESSAGE);
      const loadingMessage = screen.queryByText(MOCK_LOADING_MESSAGE);

      expect(message).toBeVisible();
      expect(loadingMessage).not.toBeInTheDocument();
    });
  });

  describe(useToast, () => {
    it('throws outside a ToastProvider', () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => renderHook(() => useToast())).toThrow(
        'useToast must be used within a ToastProvider',
      );
    });
  });
});
