import {
  DEPROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
} from '@blog/db/constants';
import type { TClientTenant } from '@platform/server/tenants/to-client-tenant';
import { act, renderWithIntl, screen } from '@platform/testing/custom-render';
import {
  doneDeprovisioningSteps,
  idleDeprovisioningSteps,
  makeClientTenant,
  MOCK_RUN_PLUS_1_MIN_AT,
  MOCK_RUN_PLUS_2_MIN_AT,
  MOCK_RUN_PLUS_7_MIN_AT,
  MOCK_RUN_STARTED_AT,
} from '@platform/testing/tenants/fixtures';
import { useDeprovisioningPoll } from '@platform/utils/use-deprovisioning-poll/use-deprovisioning-poll';
import userEvent from '@testing-library/user-event';

import { DeprovisioningStatusView } from './deprovisioning-status-view';

const REMOVE_DOMAIN_LABEL = 'Remove domain';
const ARCHIVE_SANITY_PROJECT = 'Archive Sanity project';
const REVOKE_SANITY_TOKENS_LABEL = 'Revoke Sanity tokens';
const CLEAR_PROVISIONING_ARTIFACTS = 'Clear provisioning artifacts';
const ARCHIVE_TENANT = 'Archive tenant';
const PURGE_READER_DATA = 'Purge reader data';
const INVALIDATE_CACHED_PAGES = 'Invalidate cached pages';
const ARIA_EXPANDED = 'aria-expanded';
const STARTING_BADGE = 'Starting…';
const QUEUED_BADGE = 'Queued';
const STEP_LABELS = [
  REMOVE_DOMAIN_LABEL,
  ARCHIVE_SANITY_PROJECT,
  REVOKE_SANITY_TOKENS_LABEL,
  CLEAR_PROVISIONING_ARTIFACTS,
  ARCHIVE_TENANT,
  PURGE_READER_DATA,
  INVALIDATE_CACHED_PAGES,
];

const render = renderWithIntl;

const STEP_POLL_INTERVAL_MS = 4000;

const { getTenantDeprovisioningStatusActionMock } = vi.hoisted(() => ({
  getTenantDeprovisioningStatusActionMock: vi.fn(),
}));

vi.mock(
  '@platform/server/provisioning/get-tenant-deprovisioning-status-action',
  () => ({
    getTenantDeprovisioningStatusAction:
      getTenantDeprovisioningStatusActionMock,
  }),
);

type TWrapperProps = {
  tenant: TClientTenant;
  deprovisionRequestedAt?: string;
  headingLevel?: 3;
};

const Wrapper = ({
  tenant,
  deprovisionRequestedAt,
  headingLevel,
}: TWrapperProps) => {
  const poll = useDeprovisioningPoll(tenant, {
    isEnabled: true,
    deprovisionRequestedAt,
  });
  return <DeprovisioningStatusView poll={poll} headingLevel={headingLevel} />;
};

const renderView = (
  deprovisioningSteps: TClientTenant['deprovisioningSteps'],
  props: Omit<TWrapperProps, 'tenant'> = {},
) =>
  render(
    <Wrapper tenant={makeClientTenant({ deprovisioningSteps })} {...props} />,
  );

const idleRunSteps = () => ({
  ...idleDeprovisioningSteps(),
  run: { startedAt: MOCK_RUN_STARTED_AT },
});

const runningSteps = () => ({
  ...idleRunSteps(),
  [DEPROVISIONING_STEP.REMOVE_DOMAIN]: {
    status: TENANT_PROVISIONING_STEP_STATUS.RUNNING,
  },
});

const doneRunSteps = () => ({
  ...doneDeprovisioningSteps(),
  run: {
    startedAt: MOCK_RUN_STARTED_AT,
    finishedAt: MOCK_RUN_PLUS_2_MIN_AT,
  },
});

describe(`<${DeprovisioningStatusView.name}/>`, () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    getTenantDeprovisioningStatusActionMock.mockReset();
    getTenantDeprovisioningStatusActionMock.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('before any run exists', () => {
    beforeEach(() => {
      renderView(null);
    });

    it('says no run has started yet in the Run card before any run exists', () => {
      const emptyRun = screen.getByText('No run has started yet.');

      expect(emptyRun).toBeVisible();
    });

    it('shows the full step list under the Starting badge, not "Not started", when a teardown was requested but no run marker has appeared yet', () => {
      const startingBadge = screen.getByText(STARTING_BADGE);
      const stepLabels = STEP_LABELS.map((label) => screen.getByText(label));

      for (const stepLabel of stepLabels) {
        expect(stepLabel).toBeVisible();
      }
      const queuedBadges = screen.getAllByText(QUEUED_BADGE);
      const notStartedBadge = screen.queryByText('Not started');

      expect(startingBadge).toBeVisible();
      expect(queuedBadges).toHaveLength(STEP_LABELS.length);
      expect(notStartedBadge).not.toBeInTheDocument();
    });

    it('renders a fallback Run card header carrying the overall status badge when no run exists yet', () => {
      const runHeading = screen.getByRole('heading', { level: 2, name: 'Run' });
      const startingBadge = screen.getByText(STARTING_BADGE);

      expect(runHeading).toBeVisible();
      expect(startingBadge).toBeVisible();
    });
  });

  it('shows the Starting badge and full step list, not the old failure, for a retry dispatched after a FAILED run', () => {
    renderView(
      {
        ...idleDeprovisioningSteps(),
        [DEPROVISIONING_STEP.REVOKE_SANITY_TOKENS]: {
          status: TENANT_PROVISIONING_STEP_STATUS.FAILED,
          error: 'Sanity Access API returned 403',
        },
        run: {
          startedAt: MOCK_RUN_STARTED_AT,
          finishedAt: MOCK_RUN_PLUS_1_MIN_AT,
        },
      },
      { deprovisionRequestedAt: MOCK_RUN_PLUS_7_MIN_AT },
    );

    const startingBadge = screen.getByText(STARTING_BADGE);
    const queuedBadges = screen.getAllByText(QUEUED_BADGE);
    const errorCard = screen.queryByRole('alert');

    expect(startingBadge).toBeVisible();
    expect(queuedBadges).toHaveLength(STEP_LABELS.length);
    expect(errorCard).not.toBeInTheDocument();
  });

  describe('with an idle run', () => {
    beforeEach(() => {
      renderView(idleRunSteps());
    });

    it('titles the card "Deprovisioning progress" and renders every step in order', () => {
      const progressHeading = screen.getByRole('heading', {
        level: 2,
        name: /^Deprovisioning progress/,
      });

      expect(progressHeading).toBeVisible();
      const stepLabels = STEP_LABELS.map((label) => screen.getByText(label));

      for (const stepLabel of stepLabels) {
        expect(stepLabel).toBeVisible();
      }
    });

    it('shows a 0 of 7 done badge in the steps card summary when nothing has completed yet', () => {
      const doneBadge = screen.getByText('0 of 7 done');

      expect(doneBadge).toBeVisible();
    });

    it('renders the run card once a run exists', () => {
      const runHeading = screen.getByRole('heading', { level: 2, name: 'Run' });

      expect(runHeading).toBeVisible();
    });
  });

  it('nests the steps and run headings at a caller-supplied level', () => {
    renderView(idleRunSteps(), { headingLevel: 3 });

    const progressHeading = screen.getByRole('heading', {
      level: 3,
      name: /^Deprovisioning progress/,
    });
    const runHeading = screen.getByRole('heading', { level: 3, name: 'Run' });
    const levelTwoHeading = screen.queryByRole('heading', { level: 2 });

    expect(progressHeading).toBeVisible();
    expect(runHeading).toBeVisible();
    expect(levelTwoHeading).not.toBeInTheDocument();
  });

  it('shows the Running badge while a step is in progress, with no error card', () => {
    renderView(runningSteps());

    const runningBadges = screen.getAllByText('Running…');
    const errorCard = screen.queryByRole('alert');

    expect(runningBadges.length).toBeGreaterThan(0);
    expect(errorCard).not.toBeInTheDocument();
  });

  it('shows the Complete badge once every step is done', () => {
    renderView(doneRunSteps());

    const completeBadges = screen.getAllByText('Complete');
    const errorCard = screen.queryByRole('alert');

    expect(completeBadges.length).toBeGreaterThan(0);
    expect(errorCard).not.toBeInTheDocument();
  });

  describe('a failed step', () => {
    const renderFailed = (error: string) =>
      renderView({
        ...idleDeprovisioningSteps(),
        [DEPROVISIONING_STEP.REVOKE_SANITY_TOKENS]: {
          status: TENANT_PROVISIONING_STEP_STATUS.FAILED,
          error,
        },
        run: {
          startedAt: MOCK_RUN_STARTED_AT,
          finishedAt: MOCK_RUN_PLUS_1_MIN_AT,
        },
      });

    it('shows the Failed badge, the failing step, and the raw error under Technical details', () => {
      const rawError =
        'Sanity Access API POST /access/project/xxxxx000/tokens failed: 403 {"statusCode":403,"error":"Forbidden","message":"Missing permission to revoke tokens."}';
      renderFailed(rawError);

      const failedBadges = screen.getAllByText('Failed');
      const failureHeading = screen.getByRole('heading', {
        name: 'Missing permission to complete this step',
      });
      const failingStep = screen.getByText(
        `Failed while running "${REVOKE_SANITY_TOKENS_LABEL}".`,
      );
      const technicalDetails = screen.getByText('Technical details');
      const rawErrorText = screen.getByText(rawError);

      expect(failedBadges.length).toBeGreaterThan(0);
      expect(failureHeading).toBeVisible();
      expect(failingStep).toBeVisible();
      expect(technicalDetails).toBeVisible();
      expect(rawErrorText).not.toBeVisible();
    });

    it('renders no retry button', () => {
      renderFailed('fetch failed');

      const retryButton = screen.queryByRole('button', { name: /retry/i });

      expect(retryButton).not.toBeInTheDocument();
    });

    it('falls back to a generic headline for an unrecognised failure shape', () => {
      renderFailed('CORS API is down');

      const failureHeading = screen.getByRole('heading', {
        name: 'This step failed',
      });

      expect(failureHeading).toBeVisible();
    });
  });

  describe('steps disclosure collapse', () => {
    const getStepsToggle = () =>
      screen.getByRole('button', { name: /Deprovisioning progress/ });

    it('is expanded while the run is not done', () => {
      renderView(runningSteps());

      const stepsToggle = getStepsToggle();

      expect(stepsToggle).toHaveAttribute(ARIA_EXPANDED, 'true');
    });

    it('is collapsed by default once every step is already done on mount', () => {
      renderView(doneRunSteps());

      const stepsToggle = getStepsToggle();

      expect(stepsToggle).toHaveAttribute(ARIA_EXPANDED, 'false');
    });

    it('auto-collapses once the run completes, and a later re-render does not undo a user-initiated reopen', async () => {
      getTenantDeprovisioningStatusActionMock.mockResolvedValue({
        deprovisioningSteps: doneRunSteps(),
        deprovisionedAt: new Date(MOCK_RUN_PLUS_2_MIN_AT),
      });
      const user = userEvent.setup();
      renderView(runningSteps());

      const stepsToggle = getStepsToggle();

      expect(stepsToggle).toHaveAttribute(ARIA_EXPANDED, 'true');

      await act(async () => {
        await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS);
      });

      expect(stepsToggle).toHaveAttribute(ARIA_EXPANDED, 'false');

      await user.click(stepsToggle);
      expect(stepsToggle).toHaveAttribute(ARIA_EXPANDED, 'true');

      await act(async () => {
        await vi.advanceTimersByTimeAsync(60_000);
      });

      expect(stepsToggle).toHaveAttribute(ARIA_EXPANDED, 'true');
    });
  });
});
