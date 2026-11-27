import { faker } from '@faker-js/faker';
import { ARIA_ATTRIBUTE } from '@platform/constants/aria-attribute';
import {
  RELEASE_FIELD_ERROR,
  RELEASE_REFUSAL,
} from '@platform/constants/release';
import { customRender, screen, waitFor } from '@platform/testing/custom-render';
import {
  MOCK_HEAD_SHA,
  MOCK_LAST_TAG,
  mockReleaseCandidate,
} from '@platform/testing/releases/fixtures';
import { ACTION_OUTCOME } from '@shinefold/config';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { StartReleaseDialog } from './start-release-dialog';

const { startReleaseActionMock, onStartedMock } = vi.hoisted(() => ({
  startReleaseActionMock: vi.fn(),
  onStartedMock: vi.fn(),
}));

vi.mock('@platform/server/releases/start-release-action', () => ({
  startReleaseAction: startReleaseActionMock,
}));

faker.seed(5994);

const START_RELEASE = 'Start release';
const RELEASE_RUNNING_REASON = 'A release is running.';
const MOCK_VERSION = `v${faker.system.semver()}`;
const MOCK_OVERRIDE_REASON = faker.lorem.sentence();

const setup = customRender(StartReleaseDialog, {
  headSha: MOCK_HEAD_SHA,
  lastTag: MOCK_LAST_TAG,
  migrations: mockReleaseCandidate().migrations,
  isOverrideRequired: false,
  disabledReason: undefined,
  onStarted: onStartedMock,
});

describe(`<${StartReleaseDialog.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
    onStartedMock.mockReset();
    startReleaseActionMock
      .mockReset()
      .mockResolvedValue({ outcome: ACTION_OUTCOME.SUCCESS });
  });

  const open = async (name = 'Release') => {
    const openButton = screen.getByRole('button', { name });
    await user.click(openButton);
    return screen.findByRole('alertdialog', { name: 'Release to production' });
  };

  const typeVersion = async (version: string) => {
    const versionField = screen.getByRole('textbox', { name: 'Version' });
    await user.type(versionField, version);
  };

  const confirm = async () => {
    const startButton = screen.getByRole('button', { name: START_RELEASE });
    await user.click(startButton);
  };

  describe('opened for a release that needs no override', () => {
    beforeEach(async () => {
      setup();
      await open();
    });

    it('starts the release with the typed version and tells its parent', async () => {
      await typeVersion(MOCK_VERSION);
      await confirm();

      expect(startReleaseActionMock).toHaveBeenCalledWith({
        version: MOCK_VERSION,
        headSha: MOCK_HEAD_SHA,
        overrideReason: undefined,
      });
      await waitFor(() => expect(onStartedMock).toHaveBeenCalledOnce());
    });

    it('says plainly when the release runs no migrations', () => {
      const noMigrations = screen.getByText(
        'No content migrations, no database migrations.',
      );

      expect(noMigrations).toBeVisible();
    });

    it('cannot be confirmed before a version is typed', () => {
      const startButton = screen.getByRole('button', { name: START_RELEASE });

      expect(startButton).toBeDisabled();
    });

    it('shows the refused version against its field with the last tag', async () => {
      startReleaseActionMock.mockResolvedValue({
        outcome: ACTION_OUTCOME.INVALID,
        fieldErrors: {
          version: {
            reason: RELEASE_FIELD_ERROR.VERSION_NOT_GREATER,
            values: { lastTag: MOCK_LAST_TAG },
          },
        },
      });

      await typeVersion(MOCK_LAST_TAG);
      await confirm();

      const versionError = await screen.findByText(
        `The version must be greater than the last release, ${MOCK_LAST_TAG}.`,
      );

      expect(versionError).toBeVisible();
    });

    it.each([
      [
        'a server error',
        { outcome: ACTION_OUTCOME.SERVER_ERROR },
        'GitHub did not accept the release, so nothing was started.',
      ],
      [
        'a running release',
        {
          outcome: ACTION_OUTCOME.REFUSED,
          reason: RELEASE_REFUSAL.RELEASE_RUNNING,
        },
        'A release is already running.',
      ],
      [
        'a candidate that moved since the page loaded',
        {
          outcome: ACTION_OUTCOME.REFUSED,
          reason: RELEASE_REFUSAL.RELEASE_STALE,
        },
        'main has moved since this page loaded, so nothing was started. Reload to review the new candidate.',
      ],
    ])(
      'keeps the dialog open and explains %s',
      async (_name, result, message) => {
        startReleaseActionMock.mockResolvedValue(result);

        await typeVersion(MOCK_VERSION);
        await confirm();

        const explanation = await screen.findByText(message);

        expect(explanation).toBeVisible();
        expect(onStartedMock).not.toHaveBeenCalled();
      },
    );
  });

  it('states the content and database migrations with their projects', async () => {
    setup({
      migrations: {
        contentMigrations: 2,
        tenants: 5,
        dbMigrations: 1,
        isLowerBound: false,
      },
    });

    await open();

    const summary = screen.getByText(
      '2 content migrations across 5 projects, 1 database migration.',
    );

    expect(summary).toBeVisible();
  });

  it('asks for a reason before an override can be confirmed', async () => {
    setup({ isOverrideRequired: true });

    await open('Release with override');
    await typeVersion(MOCK_VERSION);

    const startButton = screen.getByRole('button', { name: START_RELEASE });

    expect(startButton).toBeDisabled();

    const reasonField = screen.getByRole('textbox', {
      name: 'Reason for releasing anyway',
    });
    await user.type(reasonField, MOCK_OVERRIDE_REASON);
    await confirm();

    expect(startReleaseActionMock).toHaveBeenCalledWith({
      version: MOCK_VERSION,
      headSha: MOCK_HEAD_SHA,
      overrideReason: MOCK_OVERRIDE_REASON,
    });
  });

  it('cannot be opened while it is disabled', () => {
    setup({ disabledReason: RELEASE_RUNNING_REASON });

    const releaseButton = screen.getByRole('button', { name: 'Release' });
    const reason = screen.getByText(RELEASE_RUNNING_REASON);

    expect(releaseButton).toHaveAttribute(ARIA_ATTRIBUTE.DISABLED, 'true');
    expect(reason).toBeVisible();
  });
});
