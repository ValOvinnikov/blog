import { TENANT_PROVISIONING_STEP, TENANT_STATUS } from '@blog/db/constants';
import type { TTenant } from '@blog/db/schema/tenants';

import { notifyOwnerElevationOutcome } from './notify-owner-elevation-outcome';

const { notifyOperatorsOfOwnerElevationOutcomeMock } = vi.hoisted(() => ({
  notifyOperatorsOfOwnerElevationOutcomeMock: vi.fn(),
}));
const { reportStepStatusMock } = vi.hoisted(() => ({
  reportStepStatusMock: vi.fn(),
}));

// `isNotifiableOutcome` is left as the real implementation — only the send
// itself is mocked — so this file exercises the actual notifiability check
// this module runs, not a stubbed stand-in for it.
vi.mock(
  '../../recheck-tenant-owners/lib/notify-operators',
  async (importOriginal) => {
    const actual =
      await importOriginal<
        typeof import('../../recheck-tenant-owners/lib/notify-operators')
      >();
    return {
      ...actual,
      notifyOperatorsOfOwnerElevationOutcome:
        notifyOperatorsOfOwnerElevationOutcomeMock,
    };
  },
);
vi.mock('./report-step-status', () => ({
  reportStepStatus: reportStepStatusMock,
}));

function tenant(overrides: Partial<TTenant> = {}): TTenant {
  return {
    id: 't1',
    name: 'Acme',
    primaryDomain: 'acme.example.com',
    sanityProjectId: 'proj-acme',
    sanityDataset: 'production',
    sanityReadTokenEncrypted: null,
    locale: 'en',
    plan: 'FREE',
    status: TENANT_STATUS.ACTIVE,
    provisioningStatus: 'READY',
    provisioningSteps: null,
    lastNotifiedOwnerElevationOutcome: null,
    studioVercelProjectId: null,
    seededAt: null,
    webhookCreatedAt: null,
    deprovisionedAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  } as TTenant;
}

beforeEach(() => {
  notifyOperatorsOfOwnerElevationOutcomeMock
    .mockReset()
    .mockResolvedValue(undefined);
  reportStepStatusMock.mockReset().mockResolvedValue(undefined);
});

describe(notifyOwnerElevationOutcome, () => {
  it('notifies and records the outcome as notified when never notified before', async () => {
    await notifyOwnerElevationOutcome({
      tenant: tenant({ lastNotifiedOwnerElevationOutcome: null }),
      outcome: 'STALLED',
      resendApiKey: 'resend-key',
    });

    expect(notifyOperatorsOfOwnerElevationOutcomeMock).toHaveBeenCalledTimes(1);
    expect(notifyOperatorsOfOwnerElevationOutcomeMock).toHaveBeenCalledWith({
      tenant: expect.objectContaining({ id: 't1' }),
      outcome: 'STALLED',
      resendApiKey: 'resend-key',
    });
    expect(reportStepStatusMock).toHaveBeenCalledWith({
      tenantId: 't1',
      step: TENANT_PROVISIONING_STEP.OWNER_ELEVATION,
      status: 'DONE',
      detail: 'STALLED',
      notifiedOwnerElevationOutcome: 'STALLED',
    });
  });

  it('does not re-notify when the outcome matches what was already notified', async () => {
    await notifyOwnerElevationOutcome({
      tenant: tenant({ lastNotifiedOwnerElevationOutcome: 'STALLED' }),
      outcome: 'STALLED',
      resendApiKey: 'resend-key',
    });

    expect(notifyOperatorsOfOwnerElevationOutcomeMock).not.toHaveBeenCalled();
    expect(reportStepStatusMock).not.toHaveBeenCalled();
  });

  it('notifies again when the outcome transitions to a different notifiable one', async () => {
    await notifyOwnerElevationOutcome({
      tenant: tenant({ lastNotifiedOwnerElevationOutcome: 'STALLED' }),
      outcome: 'AMBIGUOUS_MEMBERSHIP',
      resendApiKey: 'resend-key',
    });

    expect(notifyOperatorsOfOwnerElevationOutcomeMock).toHaveBeenCalledTimes(1);
    expect(reportStepStatusMock).toHaveBeenCalledWith({
      tenantId: 't1',
      step: TENANT_PROVISIONING_STEP.OWNER_ELEVATION,
      status: 'DONE',
      detail: 'AMBIGUOUS_MEMBERSHIP',
      notifiedOwnerElevationOutcome: 'AMBIGUOUS_MEMBERSHIP',
    });
  });

  it.each(['ELEVATED', 'ALREADY_ADMINISTRATOR', 'PENDING_ACCEPTANCE'] as const)(
    'never notifies for a non-notifiable outcome %s',
    async (outcome) => {
      await notifyOwnerElevationOutcome({
        tenant: tenant(),
        outcome,
        resendApiKey: 'resend-key',
      });

      expect(notifyOperatorsOfOwnerElevationOutcomeMock).not.toHaveBeenCalled();
      expect(reportStepStatusMock).not.toHaveBeenCalled();
    },
  );
});
