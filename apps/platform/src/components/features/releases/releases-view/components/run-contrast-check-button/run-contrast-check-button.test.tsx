import { ACTION_OUTCOME } from '@blog/config';
import { RELEASE_REFUSAL } from '@platform/constants/release';
import { customRender, screen, waitFor } from '@platform/testing/custom-render';
import { mockRouterRefresh } from '@platform/testing/mock-router';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { RunContrastCheckButton } from './run-contrast-check-button';

const { startContrastCheckActionMock } = vi.hoisted(() => ({
  startContrastCheckActionMock: vi.fn(),
}));

vi.mock('@platform/server/releases/start-contrast-check-action', () => ({
  startContrastCheckAction: startContrastCheckActionMock,
}));

const setup = customRender(RunContrastCheckButton, {
  isRunning: false,
  onStarted: vi.fn(),
});

describe(`<${RunContrastCheckButton.name}/>`, () => {
  let user: UserEvent;
  let refresh: ReturnType<typeof mockRouterRefresh>;

  beforeEach(() => {
    user = userEvent.setup();
    refresh = mockRouterRefresh();
    startContrastCheckActionMock
      .mockReset()
      .mockResolvedValue({ outcome: ACTION_OUTCOME.SUCCESS });
  });

  it('starts the check, confirms it and refreshes the page', async () => {
    setup();

    await user.click(
      screen.getByRole('button', { name: 'Run contrast check' }),
    );

    expect(startContrastCheckActionMock).toHaveBeenCalledOnce();
    expect(await screen.findByText('Contrast check started.')).toBeVisible();
    expect(refresh).toHaveBeenCalledOnce();
  });

  it('tells its parent once the check has started', async () => {
    const onStarted = vi.fn();
    setup({ onStarted });

    await user.click(
      screen.getByRole('button', { name: 'Run contrast check' }),
    );

    await waitFor(() => expect(onStarted).toHaveBeenCalledOnce());
  });

  it('does not tell its parent when the action is refused', async () => {
    startContrastCheckActionMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: RELEASE_REFUSAL.CONTRAST_CHECK_RUNNING,
    });
    const onStarted = vi.fn();
    setup({ onStarted });

    await user.click(
      screen.getByRole('button', { name: 'Run contrast check' }),
    );

    await screen.findByText('A contrast check is already running.');
    expect(onStarted).not.toHaveBeenCalled();
  });

  it('cannot be started while a run is in progress', () => {
    setup({ isRunning: true });

    expect(
      screen.getByRole('button', { name: 'Run contrast check' }),
    ).toBeDisabled();
  });

  it('says a check is already running when the action is refused', async () => {
    startContrastCheckActionMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: RELEASE_REFUSAL.CONTRAST_CHECK_RUNNING,
    });
    setup();

    await user.click(
      screen.getByRole('button', { name: 'Run contrast check' }),
    );

    expect(
      await screen.findByText('A contrast check is already running.'),
    ).toBeVisible();
    expect(refresh).not.toHaveBeenCalled();
  });

  it('says GitHub could not be reached when the action is unavailable', async () => {
    startContrastCheckActionMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.UNAVAILABLE,
    });
    setup();

    await user.click(
      screen.getByRole('button', { name: 'Run contrast check' }),
    );

    expect(
      await screen.findByText(
        'GitHub could not be reached. Try again in a moment.',
      ),
    ).toBeVisible();
  });

  it('says the check could not be started when the dispatch fails', async () => {
    startContrastCheckActionMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.SERVER_ERROR,
    });
    setup();

    await user.click(
      screen.getByRole('button', { name: 'Run contrast check' }),
    );

    expect(
      await screen.findByText('The contrast check could not be started.'),
    ).toBeVisible();
  });
});
