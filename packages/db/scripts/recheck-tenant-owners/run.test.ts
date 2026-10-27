import { ELEVATE_TENANT_OWNER_OUTCOME } from '@blog/db/constants';
import { MOCK_RECHECK_ENV } from '@blog/db/testing/recheck-tenant-owners/fixtures';
import { mockTenant } from '@blog/db/testing/tenants/fixtures';
import { faker } from '@faker-js/faker';

import { hasSystemicFailures, runRecheck, type TRecheckSummary } from './run';

faker.seed(5803);

const {
  listTenantsPendingOwnerElevationMock,
  elevateTenantOwnerMock,
  reportOwnerElevationOutcomeMock,
  notifyOwnerElevationOutcomeMock,
} = vi.hoisted(() => ({
  listTenantsPendingOwnerElevationMock: vi.fn(),
  elevateTenantOwnerMock: vi.fn(),
  reportOwnerElevationOutcomeMock: vi.fn(),
  notifyOwnerElevationOutcomeMock: vi.fn(),
}));

vi.mock('@blog/db/queries/tenants', () => ({
  listTenantsPendingOwnerElevation: listTenantsPendingOwnerElevationMock,
}));
vi.mock('./lib/report-owner-elevation-outcome', () => ({
  reportOwnerElevationOutcome: reportOwnerElevationOutcomeMock,
}));
vi.mock('./lib/notify-owner-elevation-outcome', () => ({
  notifyOwnerElevationOutcome: notifyOwnerElevationOutcomeMock,
}));
vi.mock('./lib/elevate-tenant-owner', () => ({
  elevateTenantOwner: elevateTenantOwnerMock,
}));

const MOCK_ACL_ERROR = new Error(faker.lorem.sentence());

function mockSummary(
  overrides: Partial<TRecheckSummary> = {},
): TRecheckSummary {
  return {
    checked: 0,
    elevated: 0,
    alreadyAdministrator: 0,
    pendingAcceptance: 0,
    stalled: 0,
    ambiguous: 0,
    errors: 0,
    ...overrides,
  };
}

beforeEach(() => {
  listTenantsPendingOwnerElevationMock.mockResolvedValue([]);
});

describe(runRecheck, () => {
  it('is a clean no-op when there are no candidates', async () => {
    const summary = await runRecheck(MOCK_RECHECK_ENV);

    expect(summary).toEqual(mockSummary());
    expect(elevateTenantOwnerMock).not.toHaveBeenCalled();
  });

  it('tallies each candidate outcome into the summary', async () => {
    listTenantsPendingOwnerElevationMock.mockResolvedValue([
      mockTenant(),
      mockTenant(),
      mockTenant(),
      mockTenant(),
      mockTenant(),
    ]);
    elevateTenantOwnerMock
      .mockResolvedValueOnce(ELEVATE_TENANT_OWNER_OUTCOME.ELEVATED)
      .mockResolvedValueOnce(ELEVATE_TENANT_OWNER_OUTCOME.ALREADY_ADMINISTRATOR)
      .mockResolvedValueOnce(ELEVATE_TENANT_OWNER_OUTCOME.PENDING_ACCEPTANCE)
      .mockResolvedValueOnce(ELEVATE_TENANT_OWNER_OUTCOME.STALLED)
      .mockResolvedValueOnce(ELEVATE_TENANT_OWNER_OUTCOME.AMBIGUOUS_MEMBERSHIP);

    const summary = await runRecheck(MOCK_RECHECK_ENV);

    expect(summary).toEqual(
      mockSummary({
        checked: 5,
        elevated: 1,
        alreadyAdministrator: 1,
        pendingAcceptance: 1,
        stalled: 1,
        ambiguous: 1,
      }),
    );
    expect(hasSystemicFailures(summary)).toBe(false);
  });

  it('reports each candidate outcome against its tenant', async () => {
    const tenants = [mockTenant(), mockTenant()];
    listTenantsPendingOwnerElevationMock.mockResolvedValue(tenants);
    elevateTenantOwnerMock
      .mockResolvedValueOnce(ELEVATE_TENANT_OWNER_OUTCOME.ELEVATED)
      .mockResolvedValueOnce(ELEVATE_TENANT_OWNER_OUTCOME.STALLED);

    await runRecheck(MOCK_RECHECK_ENV);

    expect(reportOwnerElevationOutcomeMock.mock.calls).toEqual([
      [tenants[0]?.id, ELEVATE_TENANT_OWNER_OUTCOME.ELEVATED],
      [tenants[1]?.id, ELEVATE_TENANT_OWNER_OUTCOME.STALLED],
    ]);
  });

  it('counts a thrown error and still sweeps the later candidates', async () => {
    const tenants = [mockTenant(), mockTenant(), mockTenant()];
    listTenantsPendingOwnerElevationMock.mockResolvedValue(tenants);
    elevateTenantOwnerMock
      .mockResolvedValueOnce(ELEVATE_TENANT_OWNER_OUTCOME.ELEVATED)
      .mockRejectedValueOnce(MOCK_ACL_ERROR)
      .mockResolvedValueOnce(
        ELEVATE_TENANT_OWNER_OUTCOME.ALREADY_ADMINISTRATOR,
      );

    const summary = await runRecheck(MOCK_RECHECK_ENV);

    expect(summary).toEqual(
      mockSummary({
        checked: 3,
        elevated: 1,
        alreadyAdministrator: 1,
        errors: 1,
      }),
    );
    expect(hasSystemicFailures(summary)).toBe(true);
    expect(reportOwnerElevationOutcomeMock.mock.calls).toEqual([
      [tenants[0]?.id, ELEVATE_TENANT_OWNER_OUTCOME.ELEVATED],
      [tenants[2]?.id, ELEVATE_TENANT_OWNER_OUTCOME.ALREADY_ADMINISTRATOR],
    ]);
  });

  it.each([
    ELEVATE_TENANT_OWNER_OUTCOME.STALLED,
    ELEVATE_TENANT_OWNER_OUTCOME.ELEVATED,
  ])('hands a %s outcome to the notify helper', async (outcome) => {
    const tenant = mockTenant();
    listTenantsPendingOwnerElevationMock.mockResolvedValue([tenant]);
    elevateTenantOwnerMock.mockResolvedValueOnce(outcome);

    await runRecheck(MOCK_RECHECK_ENV);

    expect(notifyOwnerElevationOutcomeMock.mock.calls).toEqual([
      [{ tenant, outcome }],
    ]);
  });
});

describe(hasSystemicFailures, () => {
  it('is false when every candidate resolved to an expected outcome', () => {
    const summary = mockSummary({ checked: 2, elevated: 1, stalled: 1 });

    expect(hasSystemicFailures(summary)).toBe(false);
  });

  it('is true when at least one candidate threw', () => {
    const summary = mockSummary({ checked: 2, elevated: 1, errors: 1 });

    expect(hasSystemicFailures(summary)).toBe(true);
  });
});
