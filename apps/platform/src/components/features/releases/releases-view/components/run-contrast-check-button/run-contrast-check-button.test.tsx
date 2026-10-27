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

const RUN_CONTRAST_CHECK = { name: 'Run contrast check' };

const setup = customRender(RunContrastCheckButton, {
  isRunning: false,
  onStarted: vi.fn(),
});

describe(`<${RunContrastCheckButton.name}/>`, () => {
  let user: UserEvent;
  let refresh: ReturnType<typeof mockRouterRefresh>;

  const run = async () => {
    const runButton = screen.getByRole('button', RUN_CONTRAST_CHECK);
    await user.click(runButton);
  };

  beforeEach(() => {
    user = userEvent.setup();
    refresh = mockRouterRefresh();
    startContrastCheckActionMock
      .mockReset()
      .mockResolvedValue({ outcome: ACTION_OUTCOME.SUCCESS });
  });

  it('starts the check, confirms it and refreshes the page', async () => {
    setup();

    await run();

    const confirmation = await screen.findByText('Contrast check started.');

    expect(startContrastCheckActionMock).toHaveBeenCalledOnce();
    expect(confirmation).toBeVisible();
    expect(refresh).toHaveBeenCalledOnce();
  });

  it('tells its parent once the check has started', async () => {
    const onStarted = vi.fn();
    setup({ onStarted });

    await run();

    await waitFor(() => expect(onStarted).toHaveBeenCalledOnce());
  });

  it('cannot be started while a run is in progress', () => {
    setup({ isRunning: true });

    const runButton = screen.getByRole('button', RUN_CONTRAST_CHECK);

    expect(runButton).toBeDisabled();
  });

  it('says a check is already running and starts nothing when refused', async () => {
    startContrastCheckActionMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: RELEASE_REFUSAL.CONTRAST_CHECK_RUNNING,
    });
    const onStarted = vi.fn();
    setup({ onStarted });

    await run();

    const refusal = await screen.findByText(
      'A contrast check is already running.',
    );

    expect(refusal).toBeVisible();
    expect(refresh).not.toHaveBeenCalled();
    expect(onStarted).not.toHaveBeenCalled();
  });

  it.each([
    [
      ACTION_OUTCOME.UNAVAILABLE,
      'GitHub could not be reached. Try again in a moment.',
    ],
    [ACTION_OUTCOME.SERVER_ERROR, 'The contrast check could not be started.'],
  ])('explains a %s answer', async (outcome, message) => {
    startContrastCheckActionMock.mockResolvedValue({ outcome });
    setup();

    await run();

    const explanation = await screen.findByText(message);

    expect(explanation).toBeVisible();
  });
});
