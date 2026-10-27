import {
  DEPROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
} from '@blog/db/constants';
import type { TClientTenant } from '@platform/server/tenants/to-client-tenant';
import { act, customRender, screen } from '@platform/testing/custom-render';
import {
  mockDoneDeprovisioningSteps,
  mockIdleDeprovisioningSteps,
  mockClientTenant,
  MOCK_RUN_PLUS_1_MIN_AT,
  MOCK_RUN_PLUS_2_MIN_AT,
  MOCK_RUN_PLUS_7_MIN_AT,
  MOCK_RUN_STARTED_AT,
} from '@platform/testing/tenants/fixtures';
import { useDeprovisioningPoll } from '@platform/utils/use-deprovisioning-poll/use-deprovisioning-poll';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { DeprovisioningStatusView } from './deprovisioning-status-view';

const REMOVE_DOMAIN_LABEL = 'Remove domain';
const REVOKE_SANITY_TOKENS_LABEL = 'Revoke Sanity tokens';
const ARIA_EXPANDED = 'aria-expanded';
const STARTING_BADGE = 'Starting…';
const QUEUED_BADGE = 'Queued';
const STEP_LABELS = [
  REMOVE_DOMAIN_LABEL,
  'Archive Sanity project',
  REVOKE_SANITY_TOKENS_LABEL,
  'Clear provisioning artifacts',
  'Archive tenant',
  'Purge reader data',
  'Invalidate cached pages',
];
const STEP_POLL_INTERVAL_MS = 4000;
const MOCK_RECOGNISED_ERROR =
  'Sanity Access API POST /access/project/xxxxx000/tokens failed: 403 {"statusCode":403,"error":"Forbidden","message":"Missing permission to revoke tokens."}';
const MOCK_UNRECOGNISED_ERROR = 'CORS API is down';

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

const setup = customRender(Wrapper, { tenant: mockClientTenant() });

const setupSteps = (
  deprovisioningSteps: TClientTenant['deprovisioningSteps'],
  props: Omit<TWrapperProps, 'tenant'> = {},
) => setup({ tenant: mockClientTenant({ deprovisioningSteps }), ...props });

const idleRunSteps = () => ({
  ...mockIdleDeprovisioningSteps(),
  run: { startedAt: MOCK_RUN_STARTED_AT },
});

const runningSteps = () => ({
  ...idleRunSteps(),
  [DEPROVISIONING_STEP.REMOVE_DOMAIN]: {
    status: TENANT_PROVISIONING_STEP_STATUS.RUNNING,
  },
});

const doneRunSteps = () => ({
  ...mockDoneDeprovisioningSteps(),
  run: {
    startedAt: MOCK_RUN_STARTED_AT,
    finishedAt: MOCK_RUN_PLUS_2_MIN_AT,
  },
});

const failedRunSteps = (error: string) => ({
  ...mockIdleDeprovisioningSteps(),
  [DEPROVISIONING_STEP.REVOKE_SANITY_TOKENS]: {
    status: TENANT_PROVISIONING_STEP_STATUS.FAILED,
    error,
  },
  run: {
    startedAt: MOCK_RUN_STARTED_AT,
    finishedAt: MOCK_RUN_PLUS_1_MIN_AT,
  },
});

const advance = async (ms: number) => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
};

describe(`<${DeprovisioningStatusView.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    getTenantDeprovisioningStatusActionMock.mockReset();
    getTenantDeprovisioningStatusActionMock.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('before any run exists', () => {
    beforeEach(() => {
      setupSteps(null);
    });

    it('says no run has started yet in the Run card', () => {
      const emptyRun = screen.getByText('No run has started yet.');

      expect(emptyRun).toBeVisible();
    });

    it('shows every step as queued under the Starting badge', () => {
      const startingBadge = screen.getByText(STARTING_BADGE);
      const queuedBadges = screen.getAllByText(QUEUED_BADGE);
      const notStartedBadge = screen.queryByText('Not started');

      expect(startingBadge).toBeVisible();
      expect(queuedBadges).toHaveLength(STEP_LABELS.length);
      expect(notStartedBadge).not.toBeInTheDocument();
    });

    it('lists every step in the steps card', () => {
      const stepLabels = STEP_LABELS.map((label) => screen.getByText(label));

      for (const stepLabel of stepLabels) {
        expect(stepLabel).toBeVisible();
      }
    });

    it('still renders the Run card heading', () => {
      const runHeading = screen.getByRole('heading', { level: 2, name: 'Run' });

      expect(runHeading).toBeVisible();
    });
  });

  it('shows Starting, not the old failure, for a retry after a failed run', () => {
    setupSteps(failedRunSteps(MOCK_RECOGNISED_ERROR), {
      deprovisionRequestedAt: MOCK_RUN_PLUS_7_MIN_AT,
    });

    const startingBadge = screen.getByText(STARTING_BADGE);
    const queuedBadges = screen.getAllByText(QUEUED_BADGE);
    const errorCard = screen.queryByRole('alert');

    expect(startingBadge).toBeVisible();
    expect(queuedBadges).toHaveLength(STEP_LABELS.length);
    expect(errorCard).not.toBeInTheDocument();
  });

  describe('with an idle run', () => {
    beforeEach(() => {
      setupSteps(idleRunSteps());
    });

    it('titles the card "Deprovisioning progress" and renders every step', () => {
      const progressHeading = screen.getByRole('heading', {
        level: 2,
        name: /^Deprovisioning progress/,
      });
      const stepLabels = STEP_LABELS.map((label) => screen.getByText(label));

      expect(progressHeading).toBeVisible();
      for (const stepLabel of stepLabels) {
        expect(stepLabel).toBeVisible();
      }
    });

    it('shows nothing done in the steps card summary', () => {
      const doneBadge = screen.getByText(`0 of ${STEP_LABELS.length} done`);

      expect(doneBadge).toBeVisible();
    });

    it('renders the run card once a run exists', () => {
      const runHeading = screen.getByRole('heading', { level: 2, name: 'Run' });

      expect(runHeading).toBeVisible();
    });
  });

  it('nests the steps and run headings at a caller-supplied level', () => {
    setupSteps(idleRunSteps(), { headingLevel: 3 });

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
    setupSteps(runningSteps());

    const runningBadges = screen.getAllByText('Running…');
    const errorCard = screen.queryByRole('alert');

    expect(runningBadges.length).toBeGreaterThan(0);
    expect(errorCard).not.toBeInTheDocument();
  });

  it('shows the Complete badge once every step is done', () => {
    setupSteps(doneRunSteps());

    const completeBadges = screen.getAllByText('Complete');
    const errorCard = screen.queryByRole('alert');

    expect(completeBadges.length).toBeGreaterThan(0);
    expect(errorCard).not.toBeInTheDocument();
  });

  describe('a failed step', () => {
    it('shows the Failed badge, the failing step and the raw error', () => {
      setupSteps(failedRunSteps(MOCK_RECOGNISED_ERROR));

      const failedBadges = screen.getAllByText('Failed');
      const failureHeading = screen.getByRole('heading', {
        name: 'Missing permission to complete this step',
      });
      const failingStep = screen.getByText(
        `Failed while running "${REVOKE_SANITY_TOKENS_LABEL}".`,
      );
      const technicalDetails = screen.getByText('Technical details');
      const rawErrorText = screen.getByText(MOCK_RECOGNISED_ERROR);

      expect(failedBadges.length).toBeGreaterThan(0);
      expect(failureHeading).toBeVisible();
      expect(failingStep).toBeVisible();
      expect(technicalDetails).toBeVisible();
      expect(rawErrorText).not.toBeVisible();
    });

    it('offers no retry button', () => {
      setupSteps(failedRunSteps(MOCK_RECOGNISED_ERROR));

      const retryButton = screen.queryByRole('button', { name: /retry/i });

      expect(retryButton).not.toBeInTheDocument();
    });

    it('falls back to a generic headline for an unrecognised failure', () => {
      setupSteps(failedRunSteps(MOCK_UNRECOGNISED_ERROR));

      const failureHeading = screen.getByRole('heading', {
        name: 'This step failed',
      });

      expect(failureHeading).toBeVisible();
    });
  });

  describe('steps disclosure', () => {
    const getStepsToggle = () =>
      screen.getByRole('button', { name: /Deprovisioning progress/ });

    const completeRunWhileMounted = async () => {
      getTenantDeprovisioningStatusActionMock.mockResolvedValue({
        deprovisioningSteps: doneRunSteps(),
        deprovisionedAt: new Date(MOCK_RUN_PLUS_2_MIN_AT),
      });
      setupSteps(runningSteps());
      await advance(STEP_POLL_INTERVAL_MS);
    };

    it('is expanded while the run is not done', () => {
      setupSteps(runningSteps());

      const stepsToggle = getStepsToggle();

      expect(stepsToggle).toHaveAttribute(ARIA_EXPANDED, 'true');
    });

    it('is collapsed by default when every step is already done on mount', () => {
      setupSteps(doneRunSteps());

      const stepsToggle = getStepsToggle();

      expect(stepsToggle).toHaveAttribute(ARIA_EXPANDED, 'false');
    });

    it('collapses by itself once the run completes', async () => {
      await completeRunWhileMounted();

      const stepsToggle = getStepsToggle();

      expect(stepsToggle).toHaveAttribute(ARIA_EXPANDED, 'false');
    });

    it('stays open after a user reopens it and the poll refreshes', async () => {
      await completeRunWhileMounted();
      const stepsToggle = getStepsToggle();

      await user.click(stepsToggle);
      await advance(STEP_POLL_INTERVAL_MS * 3);

      expect(stepsToggle).toHaveAttribute(ARIA_EXPANDED, 'true');
    });
  });
});
