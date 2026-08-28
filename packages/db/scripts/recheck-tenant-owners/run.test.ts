import {
  TENANT_STATUS,
  type TElevateTenantOwnerOutcome,
} from '@blog/db/constants';
import type { TTenant } from '@blog/db/schema/tenants';

import { hasSystemicFailures, runRecheck } from './run';

const { listTenantsPendingOwnerElevationMock } = vi.hoisted(() => ({
  listTenantsPendingOwnerElevationMock: vi.fn(),
}));
const { elevateTenantOwnerMock } = vi.hoisted(() => ({
  elevateTenantOwnerMock: vi.fn(),
}));

const { reportOwnerElevationOutcomeMock } = vi.hoisted(() => ({
  reportOwnerElevationOutcomeMock: vi.fn(),
}));

const { notifyOperatorsOfOwnerElevationOutcomeMock } = vi.hoisted(() => ({
  notifyOperatorsOfOwnerElevationOutcomeMock: vi.fn(),
}));

vi.mock('@blog/db/queries/tenants', () => ({
  listTenantsPendingOwnerElevation: listTenantsPendingOwnerElevationMock,
}));
vi.mock('../provision-tenant/lib/report-owner-elevation-outcome', () => ({
  reportOwnerElevationOutcome: reportOwnerElevationOutcomeMock,
}));
vi.mock('../provision-tenant/steps/elevate-tenant-owner', () => ({
  elevateTenantOwner: elevateTenantOwnerMock,
}));
// `isNotifiableOutcome` is left as the real implementation — only the send
// itself is mocked — so this file exercises the actual de-dup condition
// `recheckOne` runs, not a stubbed stand-in for it.
vi.mock('./lib/notify-operators', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('./lib/notify-operators')>();
  return {
    ...actual,
    notifyOperatorsOfOwnerElevationOutcome:
      notifyOperatorsOfOwnerElevationOutcomeMock,
  };
});

const env = {
  sanityManagementToken: 'sanity-token',
  resendApiKey: 'resend-key',
};

function tenant(
  id: string,
  slug: string,
  previousOwnerElevationOutcome?: TElevateTenantOwnerOutcome,
): TTenant {
  return {
    id,
    slug,
    name: slug,
    primaryDomain: `${slug}.example.com`,
    sanityProjectId: `proj-${slug}`,
    sanityDataset: 'production',
    sanityReadTokenEncrypted: null,
    locale: 'en',
    plan: 'FREE',
    status: TENANT_STATUS.ACTIVE,
    provisioningStatus: 'READY',
    provisioningSteps: previousOwnerElevationOutcome
      ? {
          OWNER_ELEVATION: {
            status: 'DONE',
            detail: previousOwnerElevationOutcome,
          },
        }
      : null,
    studioVercelProjectId: null,
    seededAt: null,
    webhookCreatedAt: null,
    deprovisionedAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  } as TTenant;
}

beforeEach(() => {
  listTenantsPendingOwnerElevationMock.mockReset().mockResolvedValue([]);
  elevateTenantOwnerMock.mockReset();
  reportOwnerElevationOutcomeMock.mockReset().mockResolvedValue(undefined);
  notifyOperatorsOfOwnerElevationOutcomeMock
    .mockReset()
    .mockResolvedValue(undefined);
});

describe(runRecheck, () => {
  it('is a clean no-op when there are no candidates', async () => {
    const summary = await runRecheck(env);

    expect(summary).toEqual({
      checked: 0,
      elevated: 0,
      alreadyAdministrator: 0,
      pendingAcceptance: 0,
      stalled: 0,
      ambiguous: 0,
      errors: 0,
    });
    expect(elevateTenantOwnerMock).not.toHaveBeenCalled();
  });

  it('tallies each candidate outcome into the summary', async () => {
    const tenants = [
      tenant('t1', 'acme'),
      tenant('t2', 'globex'),
      tenant('t3', 'initech'),
      tenant('t4', 'umbrella'),
      tenant('t5', 'soylent'),
    ];
    listTenantsPendingOwnerElevationMock.mockResolvedValue(tenants);
    elevateTenantOwnerMock
      .mockResolvedValueOnce('ELEVATED')
      .mockResolvedValueOnce('ALREADY_ADMINISTRATOR')
      .mockResolvedValueOnce('PENDING_ACCEPTANCE')
      .mockResolvedValueOnce('STALLED')
      .mockResolvedValueOnce('AMBIGUOUS_MEMBERSHIP');

    const summary = await runRecheck(env);

    expect(summary).toEqual({
      checked: 5,
      elevated: 1,
      alreadyAdministrator: 1,
      pendingAcceptance: 1,
      stalled: 1,
      ambiguous: 1,
      errors: 0,
    });
    expect(elevateTenantOwnerMock).toHaveBeenCalledTimes(5);
    expect(hasSystemicFailures(summary)).toBe(false);
    expect(reportOwnerElevationOutcomeMock).toHaveBeenCalledTimes(5);
    expect(reportOwnerElevationOutcomeMock).toHaveBeenNthCalledWith(
      1,
      't1',
      'ELEVATED',
    );
    expect(reportOwnerElevationOutcomeMock).toHaveBeenNthCalledWith(
      2,
      't2',
      'ALREADY_ADMINISTRATOR',
    );
    expect(reportOwnerElevationOutcomeMock).toHaveBeenNthCalledWith(
      3,
      't3',
      'PENDING_ACCEPTANCE',
    );
    expect(reportOwnerElevationOutcomeMock).toHaveBeenNthCalledWith(
      4,
      't4',
      'STALLED',
    );
    expect(reportOwnerElevationOutcomeMock).toHaveBeenNthCalledWith(
      5,
      't5',
      'AMBIGUOUS_MEMBERSHIP',
    );
  });

  it('counts a thrown error without stopping the sweep for later candidates', async () => {
    const tenants = [
      tenant('t1', 'acme'),
      tenant('t2', 'globex'),
      tenant('t3', 'initech'),
    ];
    listTenantsPendingOwnerElevationMock.mockResolvedValue(tenants);
    elevateTenantOwnerMock
      .mockResolvedValueOnce('ELEVATED')
      .mockRejectedValueOnce(new Error('acl fetch failed'))
      .mockResolvedValueOnce('ALREADY_ADMINISTRATOR');

    const summary = await runRecheck(env);

    expect(summary).toEqual({
      checked: 3,
      elevated: 1,
      alreadyAdministrator: 1,
      pendingAcceptance: 0,
      stalled: 0,
      ambiguous: 0,
      errors: 1,
    });
    expect(elevateTenantOwnerMock).toHaveBeenCalledTimes(3);
    expect(hasSystemicFailures(summary)).toBe(true);
    // The throwing candidate (t2) never reaches `reportOwnerElevationOutcome`
    // — only the two that resolved do.
    expect(reportOwnerElevationOutcomeMock).toHaveBeenCalledTimes(2);
    expect(reportOwnerElevationOutcomeMock).toHaveBeenCalledWith(
      't1',
      'ELEVATED',
    );
    expect(reportOwnerElevationOutcomeMock).toHaveBeenCalledWith(
      't3',
      'ALREADY_ADMINISTRATOR',
    );
    expect(reportOwnerElevationOutcomeMock).not.toHaveBeenCalledWith(
      't2',
      expect.anything(),
    );
  });

  it('notifies operators when a tenant newly transitions into STALLED', async () => {
    const tenants = [tenant('t1', 'acme')];
    listTenantsPendingOwnerElevationMock.mockResolvedValue(tenants);
    elevateTenantOwnerMock.mockResolvedValueOnce('STALLED');

    await runRecheck(env);

    expect(notifyOperatorsOfOwnerElevationOutcomeMock).toHaveBeenCalledTimes(1);
    expect(notifyOperatorsOfOwnerElevationOutcomeMock).toHaveBeenCalledWith({
      tenant: tenants[0],
      outcome: 'STALLED',
      resendApiKey: 'resend-key',
    });
  });

  it('does not re-notify a tenant already STALLED on a prior sweep that is still STALLED', async () => {
    const tenants = [tenant('t1', 'acme', 'STALLED')];
    listTenantsPendingOwnerElevationMock.mockResolvedValue(tenants);
    elevateTenantOwnerMock.mockResolvedValueOnce('STALLED');

    await runRecheck(env);

    expect(notifyOperatorsOfOwnerElevationOutcomeMock).not.toHaveBeenCalled();
  });

  it('notifies again when a tenant transitions from STALLED to AMBIGUOUS_MEMBERSHIP', async () => {
    const tenants = [tenant('t1', 'acme', 'STALLED')];
    listTenantsPendingOwnerElevationMock.mockResolvedValue(tenants);
    elevateTenantOwnerMock.mockResolvedValueOnce('AMBIGUOUS_MEMBERSHIP');

    await runRecheck(env);

    expect(notifyOperatorsOfOwnerElevationOutcomeMock).toHaveBeenCalledTimes(1);
    expect(notifyOperatorsOfOwnerElevationOutcomeMock).toHaveBeenCalledWith({
      tenant: tenants[0],
      outcome: 'AMBIGUOUS_MEMBERSHIP',
      resendApiKey: 'resend-key',
    });
  });

  it.each(['ELEVATED', 'ALREADY_ADMINISTRATOR', 'PENDING_ACCEPTANCE'] as const)(
    'never notifies for outcome %s',
    async (outcome) => {
      const tenants = [tenant('t1', 'acme')];
      listTenantsPendingOwnerElevationMock.mockResolvedValue(tenants);
      elevateTenantOwnerMock.mockResolvedValueOnce(outcome);

      await runRecheck(env);

      expect(notifyOperatorsOfOwnerElevationOutcomeMock).not.toHaveBeenCalled();
    },
  );
});

describe(hasSystemicFailures, () => {
  it('is false when every candidate resolved to an expected outcome', () => {
    expect(
      hasSystemicFailures({
        checked: 4,
        elevated: 1,
        alreadyAdministrator: 1,
        pendingAcceptance: 1,
        stalled: 1,
        ambiguous: 0,
        errors: 0,
      }),
    ).toBe(false);
  });

  it('is true when at least one candidate threw', () => {
    expect(
      hasSystemicFailures({
        checked: 4,
        elevated: 3,
        alreadyAdministrator: 0,
        pendingAcceptance: 0,
        stalled: 0,
        ambiguous: 0,
        errors: 1,
      }),
    ).toBe(true);
  });
});
