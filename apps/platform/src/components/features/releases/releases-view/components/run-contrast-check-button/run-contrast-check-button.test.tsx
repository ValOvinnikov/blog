import { ACTION_OUTCOME } from '@blog/config';
import { customRender, screen } from '@platform/testing/custom-render';
import { mockRouterRefresh } from '@platform/testing/mock-router';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { RunContrastCheckButton } from './run-contrast-check-button';

const { startContrastCheckActionMock } = vi.hoisted(() => ({
  startContrastCheckActionMock: vi.fn(),
}));

vi.mock('@platform/server/releases/start-contrast-check-action', () => ({
  startContrastCheckAction: startContrastCheckActionMock,
}));

const setup = customRender(RunContrastCheckButton, { isRunning: false });

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
    expect(await screen.findByText(/Contrast check started/)).toBeVisible();
    expect(refresh).toHaveBeenCalledOnce();
  });

  it('stays disabled once a check has started', async () => {
    setup();

    await user.click(
      screen.getByRole('button', { name: 'Run contrast check' }),
    );

    expect(
      await screen.findByRole('button', { name: 'Run contrast check' }),
    ).toBeDisabled();
  });

  it('cannot be started while a run is in progress', () => {
    setup({ isRunning: true });

    expect(
      screen.getByRole('button', { name: 'Run contrast check' }),
    ).toBeDisabled();
  });

  it('says a check is already running when the action is blocked', async () => {
    startContrastCheckActionMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.BLOCKED,
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
