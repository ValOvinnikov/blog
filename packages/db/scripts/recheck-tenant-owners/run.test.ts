import { TENANT_STATUS } from '@blog/db/constants';
import type { TTenant } from '@blog/db/schema/tenants';

import { runRecheck } from './run';

const { listTenantsPendingOwnerElevationMock } = vi.hoisted(() => ({
  listTenantsPendingOwnerElevationMock: vi.fn(),
}));
const { elevateTenantOwnerMock } = vi.hoisted(() => ({
  elevateTenantOwnerMock: vi.fn(),
}));

vi.mock('@blog/db/queries/tenants', () => ({
  listTenantsPendingOwnerElevation: listTenantsPendingOwnerElevationMock,
}));
vi.mock('../provision-tenant/steps/elevate-tenant-owner', () => ({
  ELEVATE_TENANT_OWNER_OUTCOME: {
    ELEVATED: 'ELEVATED',
    ALREADY_ADMINISTRATOR: 'ALREADY_ADMINISTRATOR',
    PENDING_ACCEPTANCE: 'PENDING_ACCEPTANCE',
    STALLED: 'STALLED',
    AMBIGUOUS_MEMBERSHIP: 'AMBIGUOUS_MEMBERSHIP',
  },
  elevateTenantOwner: elevateTenantOwnerMock,
}));

const env = { sanityManagementToken: 'sanity-token' };

function tenant(id: string, slug: string): TTenant {
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
    provisioningSteps: null,
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
  });
});
