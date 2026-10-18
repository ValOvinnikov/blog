import { ACTION_OUTCOME } from '@blog/config';
import {
  RELEASE_FIELD_ERROR,
  RELEASE_REFUSAL,
} from '@platform/constants/release';
import { customRender, screen, waitFor } from '@platform/testing/custom-render';
import { makeReleaseCandidate } from '@platform/testing/releases/fixtures';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { StartReleaseDialog } from './start-release-dialog';

const { startReleaseActionMock } = vi.hoisted(() => ({
  startReleaseActionMock: vi.fn(),
}));

vi.mock('@platform/server/releases/start-release-action', () => ({
  startReleaseAction: startReleaseActionMock,
}));

const { migrations } = makeReleaseCandidate();

const setup = customRender(StartReleaseDialog, {
  lastTag: 'v1.4.0',
  migrations,
  isOverrideRequired: false,
  disabledReason: undefined,
  onStarted: vi.fn(),
});

describe(`<${StartReleaseDialog.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
    startReleaseActionMock
      .mockReset()
      .mockResolvedValue({ outcome: ACTION_OUTCOME.SUCCESS });
  });

  const open = async (name = 'Release') => {
    await user.click(screen.getByRole('button', { name }));
    return screen.findByRole('alertdialog', { name: 'Release to production' });
  };

  const typeVersion = (version: string) =>
    user.type(screen.getByRole('textbox', { name: 'Version' }), version);

  const confirm = () =>
    user.click(screen.getByRole('button', { name: 'Start release' }));

  it('starts the release with the typed version and tells its parent', async () => {
    const onStarted = vi.fn();
    setup({ onStarted });

    await open();
    await typeVersion('v1.5.0');
    await confirm();

    expect(startReleaseActionMock).toHaveBeenCalledWith({
      version: 'v1.5.0',
      overrideReason: undefined,
    });
    await waitFor(() => expect(onStarted).toHaveBeenCalledOnce());
  });

  it('says plainly when the release runs no migrations', async () => {
    setup();

    await open();

    expect(
      screen.getByText('No content migrations, no database migrations.'),
    ).toBeVisible();
  });

  it('states the content migrations, their projects and the database migrations', async () => {
    setup({
      migrations: {
        contentMigrations: 2,
        tenants: 5,
        dbMigrations: 1,
        isLowerBound: false,
      },
    });

    await open();

    expect(
      screen.getByText(
        '2 content migrations across 5 projects, 1 database migration.',
      ),
    ).toBeVisible();
  });

  it('cannot be confirmed before a version is typed', async () => {
    setup();

    await open();

    expect(
      screen.getByRole('button', { name: 'Start release' }),
    ).toBeDisabled();
  });

  it('shows the refused version against its field, naming the last tag', async () => {
    startReleaseActionMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {
        version: {
          reason: RELEASE_FIELD_ERROR.VERSION_NOT_GREATER,
          values: { lastTag: 'v1.4.0' },
        },
      },
    });
    setup();

    await open();
    await typeVersion('v1.4.0');
    await confirm();

    expect(
      await screen.findByText(
        'The version must be greater than the last release, v1.4.0.',
      ),
    ).toBeVisible();
  });

  it('asks for a reason before an override can be confirmed', async () => {
    setup({ isOverrideRequired: true });

    await open('Release with override');
    await typeVersion('v1.5.0');

    expect(
      screen.getByRole('button', { name: 'Start release' }),
    ).toBeDisabled();

    await user.type(
      screen.getByRole('textbox', { name: 'Reason for releasing anyway' }),
      'Hotfix',
    );
    await confirm();

    expect(startReleaseActionMock).toHaveBeenCalledWith({
      version: 'v1.5.0',
      overrideReason: 'Hotfix',
    });
  });

  it.each([
    [
      { outcome: ACTION_OUTCOME.SERVER_ERROR },
      'GitHub did not accept the release, so nothing was started.',
    ],
    [
      {
        outcome: ACTION_OUTCOME.REFUSED,
        reason: RELEASE_REFUSAL.RELEASE_RUNNING,
      },
      'A release is already running.',
    ],
  ])('keeps the dialog open and explains a %o', async (result, message) => {
    const onStarted = vi.fn();
    startReleaseActionMock.mockResolvedValue(result);
    setup({ onStarted });

    await open();
    await typeVersion('v1.5.0');
    await confirm();

    expect(await screen.findByText(message)).toBeVisible();
    expect(onStarted).not.toHaveBeenCalled();
  });

  it('cannot be opened while it is disabled', () => {
    setup({ disabledReason: 'A release is running.' });

    expect(screen.getByRole('button', { name: 'Release' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(screen.getByText('A release is running.')).toBeVisible();
  });
});
