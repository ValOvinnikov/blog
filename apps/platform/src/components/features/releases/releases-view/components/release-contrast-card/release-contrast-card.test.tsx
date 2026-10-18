import { ACTION_OUTCOME } from '@blog/config';
import { CONTRAST_STATUS } from '@platform/constants/release';
import { customRender, screen } from '@platform/testing/custom-render';
import { mockRouterRefresh } from '@platform/testing/mock-router';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { ReleaseContrastCard } from './release-contrast-card';

const { startContrastCheckActionMock } = vi.hoisted(() => ({
  startContrastCheckActionMock: vi.fn(),
}));

vi.mock('@platform/i18n/navigation');
vi.mock('@platform/server/releases/start-contrast-check-action', () => ({
  startContrastCheckAction: startContrastCheckActionMock,
}));

const setup = customRender(ReleaseContrastCard, {
  status: CONTRAST_STATUS.DUE,
});

describe(`<${ReleaseContrastCard.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
    mockRouterRefresh();
    startContrastCheckActionMock
      .mockReset()
      .mockResolvedValue({ outcome: ACTION_OUTCOME.SUCCESS });
  });

  const start = () =>
    user.click(screen.getByRole('button', { name: 'Run contrast check' }));

  it.each([CONTRAST_STATUS.DUE, CONTRAST_STATUS.NONE])(
    'shows Running and disables the button once a start from %s succeeds',
    async (status) => {
      setup({ status });

      await start();

      expect(await screen.findByText('Running')).toBeVisible();
      expect(
        screen.getByText('A contrast check is running for the latest commit.'),
      ).toBeVisible();
      expect(
        screen.getByRole('button', { name: 'Run contrast check' }),
      ).toBeDisabled();
    },
  );

  it.each([CONTRAST_STATUS.GREEN, CONTRAST_STATUS.FAILED])(
    'replaces a stale %s result with Running on a rerun',
    async (status) => {
      setup({ status });

      await start();

      expect(await screen.findByText('Running')).toBeVisible();
      expect(
        screen.getByRole('button', { name: 'Run contrast check' }),
      ).toBeDisabled();
    },
  );

  it('lets a changed server status take over from the optimistic Running', async () => {
    const { rerender } = setup();
    await start();
    await screen.findByText('Running');

    rerender(<ReleaseContrastCard status={CONTRAST_STATUS.GREEN} />);

    expect(screen.getByText('Passed')).toBeVisible();
    expect(screen.queryByText('Running')).not.toBeInTheDocument();
  });

  it('does not flip back to Running when the server returns to the start status', async () => {
    const { rerender } = setup();
    await start();
    await screen.findByText('Running');

    rerender(<ReleaseContrastCard status={CONTRAST_STATUS.GREEN} />);
    rerender(<ReleaseContrastCard status={CONTRAST_STATUS.DUE} />);

    expect(screen.getByText('Due')).toBeVisible();
    expect(screen.queryByText('Running')).not.toBeInTheDocument();
  });

  it.each([ACTION_OUTCOME.BLOCKED, ACTION_OUTCOME.SERVER_ERROR])(
    'leaves the status unchanged when the start answers %s',
    async (outcome) => {
      startContrastCheckActionMock.mockResolvedValue({ outcome });
      setup();

      await start();

      await screen.findByRole('button', { name: 'Run contrast check' });
      expect(screen.getByText('Due')).toBeVisible();
      expect(screen.queryByText('Running')).not.toBeInTheDocument();
    },
  );
});
