import { TENANT_STATUS } from '@blog/db/constants';
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

const { notifyOwnerElevationOutcomeMock } = vi.hoisted(() => ({
  notifyOwnerElevationOutcomeMock: vi.fn(),
}));

vi.mock('@blog/db/queries/tenants', () => ({
  listTenantsPendingOwnerElevation: listTenantsPendingOwnerElevationMock,
}));
vi.mock('../provision-tenant/lib/report-owner-elevation-outcome', () => ({
  reportOwnerElevationOutcome: reportOwnerElevationOutcomeMock,
}));
vi.mock('../provision-tenant/lib/notify-owner-elevation-outcome', () => ({
  notifyOwnerElevationOutcome: notifyOwnerElevationOutcomeMock,
}));
vi.mock('../provision-tenant/steps/elevate-tenant-owner', () => ({
  elevateTenantOwner: elevateTenantOwnerMock,
}));

const env = {
  sanityManagementToken: 'sanity-token',
};

function tenant(id: string, name: string): TTenant {
  return {
    id,
    name,
    primaryDomain: `${name}.example.com`,
    sanityProjectId: `proj-${name}`,
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
  } as TTenant;
}

beforeEach(() => {
  listTenantsPendingOwnerElevationMock.mockReset().mockResolvedValue([]);
  elevateTenantOwnerMock.mockReset();
  reportOwnerElevationOutcomeMock.mockReset().mockResolvedValue(undefined);
  notifyOwnerElevationOutcomeMock.mockReset().mockResolvedValue(undefined);
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

  it('delegates every candidate outcome to the shared notify-and-mark-notified helper', async () => {
    const tenants = [tenant('t1', 'acme')];
    listTenantsPendingOwnerElevationMock.mockResolvedValue(tenants);
    elevateTenantOwnerMock.mockResolvedValueOnce('STALLED');

    await runRecheck(env);

    expect(notifyOwnerElevationOutcomeMock).toHaveBeenCalledTimes(1);
    expect(notifyOwnerElevationOutcomeMock).toHaveBeenCalledWith({
      tenant: tenants[0],
      outcome: 'STALLED',
    });
  });

  it('still delegates a non-notifiable outcome — the helper itself decides whether to notify', async () => {
    const tenants = [tenant('t1', 'acme')];
    listTenantsPendingOwnerElevationMock.mockResolvedValue(tenants);
    elevateTenantOwnerMock.mockResolvedValueOnce('ELEVATED');

    await runRecheck(env);

    expect(notifyOwnerElevationOutcomeMock).toHaveBeenCalledTimes(1);
    expect(notifyOwnerElevationOutcomeMock).toHaveBeenCalledWith({
      tenant: tenants[0],
      outcome: 'ELEVATED',
    });
  });
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
