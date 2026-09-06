import { TENANT_STATUS } from '@blog/db/constants';
import type { TTenant } from '@blog/db/schema/tenants';

import { notifyOwnerElevationOutcome } from './notify-owner-elevation-outcome';

const { notifyOperatorsOfOwnerElevationOutcomeMock } = vi.hoisted(() => ({
  notifyOperatorsOfOwnerElevationOutcomeMock: vi.fn(),
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
});

describe(notifyOwnerElevationOutcome, () => {
  it('notifies and returns the outcome sent when never notified before', async () => {
    const result = await notifyOwnerElevationOutcome({
      tenant: tenant({ lastNotifiedOwnerElevationOutcome: null }),
      outcome: 'STALLED',
    });

    expect(notifyOperatorsOfOwnerElevationOutcomeMock).toHaveBeenCalledTimes(1);
    expect(notifyOperatorsOfOwnerElevationOutcomeMock).toHaveBeenCalledWith({
      tenant: expect.objectContaining({ id: 't1' }),
      outcome: 'STALLED',
    });
    expect(result).toBe('STALLED');
  });

  it('does not re-notify, and returns undefined, when the outcome matches what was already notified', async () => {
    const result = await notifyOwnerElevationOutcome({
      tenant: tenant({ lastNotifiedOwnerElevationOutcome: 'STALLED' }),
      outcome: 'STALLED',
    });

    expect(notifyOperatorsOfOwnerElevationOutcomeMock).not.toHaveBeenCalled();
    expect(result).toBeUndefined();
  });

  it('notifies again when the outcome transitions to a different notifiable one', async () => {
    const result = await notifyOwnerElevationOutcome({
      tenant: tenant({ lastNotifiedOwnerElevationOutcome: 'STALLED' }),
      outcome: 'AMBIGUOUS_MEMBERSHIP',
    });

    expect(notifyOperatorsOfOwnerElevationOutcomeMock).toHaveBeenCalledTimes(1);
    expect(result).toBe('AMBIGUOUS_MEMBERSHIP');
  });

  it.each(['ELEVATED', 'ALREADY_ADMINISTRATOR', 'PENDING_ACCEPTANCE'] as const)(
    'never notifies, and returns undefined, for a non-notifiable outcome %s',
    async (outcome) => {
      const result = await notifyOwnerElevationOutcome({
        tenant: tenant(),
        outcome,
      });

      expect(notifyOperatorsOfOwnerElevationOutcomeMock).not.toHaveBeenCalled();
      expect(result).toBeUndefined();
    },
  );
});
