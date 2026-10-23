import { HTTP_STATUS, SANITY_PROJECT_ROLE } from '@blog/config';
import { TENANT_PROVISIONING_STATUS } from '@blog/db/constants';
import type { TTenant } from '@blog/db/schema/tenants';
import type * as SanityProjectAccess from '@blog/db/utils/sanity-management-client/sanity-project-access';
import { SANITY_PENDING_INVITE_STATUS } from '@worker/constants/owner-access';
import {
  MOCK_MIXED_CASE_OWNER_EMAIL,
  MOCK_OWNER_EMAIL,
} from '@worker/testing/owner-access/fixtures';
import { MOCK_PROVISION_ENV } from '@worker/testing/provision-env/fake-provision-env';
import {
  MOCK_SANITY_PROJECT_ID,
  MOCK_TENANT_ID,
  mockTenant,
} from '@worker/testing/tenant/fixtures';
import { logger } from '@worker/utils/logger/logger';

import { createTenantSanityProject } from './create-sanity-project';

const {
  setTenantSanityProjectMock,
  getTenantOwnerEmailMock,
  createSanityProjectMock,
  createSanityDatasetMock,
  addSanityCorsOriginMock,
  createSanityProjectInviteMock,
  listSanityDatasetsMock,
  listSanityCorsOriginsMock,
  listSanityProjectInvitesMock,
  callOrder,
} = vi.hoisted(() => {
  const callOrder: string[] = [];
  return {
    setTenantSanityProjectMock: vi.fn(),
    getTenantOwnerEmailMock: vi.fn(),
    createSanityProjectMock: vi.fn(),
    createSanityDatasetMock: vi.fn(),
    addSanityCorsOriginMock: vi.fn(),
    createSanityProjectInviteMock: vi.fn(),
    listSanityDatasetsMock: vi.fn(),
    listSanityCorsOriginsMock: vi.fn(),
    listSanityProjectInvitesMock: vi.fn(),
    callOrder,
  };
});

vi.mock('@blog/db/queries/tenants', () => ({
  setTenantSanityProject: setTenantSanityProjectMock,
}));

vi.mock('@blog/db/queries/memberships', () => ({
  getTenantOwnerEmail: getTenantOwnerEmailMock,
}));

vi.mock('@blog/db/utils/sanity-management-client/sanity-project-setup', () => ({
  createSanityProject: createSanityProjectMock,
  createSanityDataset: createSanityDatasetMock,
  addSanityCorsOrigin: addSanityCorsOriginMock,
  listSanityDatasets: listSanityDatasetsMock,
  listSanityCorsOrigins: listSanityCorsOriginsMock,
}));

vi.mock(
  import('@blog/db/utils/sanity-management-client/sanity-project-access'),
  () => ({
    createSanityProjectInvite: createSanityProjectInviteMock,
    listSanityProjectInvites: listSanityProjectInvitesMock,
  }),
);

const PROJECT_ID = 'proj456';
const {
  sanityManagementToken,
  sanityOrganizationId,
  platformAppBaseUrl,
  tenantSanityDataset,
} = MOCK_PROVISION_ENV;

function baseTenant(overrides: Partial<TTenant> = {}): TTenant {
  return mockTenant({
    provisioningStatus: TENANT_PROVISIONING_STATUS.PENDING,
    ...overrides,
  });
}

beforeEach(() => {
  callOrder.length = 0;
  setTenantSanityProjectMock.mockReset();
  getTenantOwnerEmailMock.mockReset();
  createSanityProjectMock.mockReset();
  createSanityDatasetMock.mockReset();
  addSanityCorsOriginMock.mockReset();
  createSanityProjectInviteMock.mockReset();
  listSanityDatasetsMock.mockReset();
  listSanityCorsOriginsMock.mockReset();
  listSanityProjectInvitesMock.mockReset();

  setTenantSanityProjectMock.mockImplementation(async () => {
    callOrder.push('setTenantSanityProject');
  });
  getTenantOwnerEmailMock.mockImplementation(async () => {
    callOrder.push('getTenantOwnerEmail');
    return MOCK_OWNER_EMAIL;
  });
  createSanityProjectMock.mockImplementation(async () => {
    callOrder.push('createSanityProject');
    return { id: PROJECT_ID };
  });
  createSanityDatasetMock.mockImplementation(async () => {
    callOrder.push('createSanityDataset');
  });
  addSanityCorsOriginMock.mockImplementation(async () => {
    callOrder.push('addSanityCorsOrigin');
  });
  createSanityProjectInviteMock.mockImplementation(async () => {
    callOrder.push('createSanityProjectInvite');
  });
  listSanityDatasetsMock.mockImplementation(async () => {
    callOrder.push('listSanityDatasets');
    return [];
  });
  listSanityCorsOriginsMock.mockImplementation(async () => {
    callOrder.push('listSanityCorsOrigins');
    return [];
  });
  listSanityProjectInvitesMock.mockImplementation(async () => {
    callOrder.push('listSanityProjectInvites');
    return [];
  });
});

describe(createTenantSanityProject, () => {
  describe('for a tenant with no Sanity project yet', () => {
    let tenant: TTenant;

    beforeEach(() => {
      tenant = baseTenant();
    });

    it('creates the project, dataset, and CORS origin in order, persisting the project immediately after creation', async () => {
      const result = await createTenantSanityProject(
        tenant,
        MOCK_PROVISION_ENV,
      );

      expect(createSanityProjectMock).toHaveBeenCalledWith({
        token: sanityManagementToken,
        displayName: 'Acme',
        organizationId: sanityOrganizationId,
      });
      expect(setTenantSanityProjectMock).toHaveBeenCalledWith(MOCK_TENANT_ID, {
        sanityProjectId: PROJECT_ID,
        sanityDataset: tenantSanityDataset,
      });
      expect(createSanityDatasetMock).toHaveBeenCalledWith({
        token: sanityManagementToken,
        projectId: PROJECT_ID,
        dataset: tenantSanityDataset,
      });
      expect(addSanityCorsOriginMock).toHaveBeenCalledWith({
        token: sanityManagementToken,
        projectId: PROJECT_ID,
        origin: platformAppBaseUrl,
        allowCredentials: true,
      });
      expect(result).toEqual({
        sanityProjectId: PROJECT_ID,
        sanityDataset: tenantSanityDataset,
      });

      expect(callOrder.indexOf('createSanityProject')).toBe(0);
      expect(callOrder.indexOf('setTenantSanityProject')).toBe(1);
      expect(callOrder.indexOf('setTenantSanityProject')).toBeLessThan(
        callOrder.indexOf('createSanityDataset'),
      );
      expect(callOrder.indexOf('setTenantSanityProject')).toBeLessThan(
        callOrder.indexOf('addSanityCorsOrigin'),
      );
    });

    it('persists the created project before a later CORS failure propagates', async () => {
      addSanityCorsOriginMock.mockImplementation(async () => {
        callOrder.push('addSanityCorsOrigin');
        throw new Error('CORS API is down');
      });

      await expect(
        createTenantSanityProject(tenant, MOCK_PROVISION_ENV),
      ).rejects.toThrow(/CORS API is down/);

      expect(setTenantSanityProjectMock).toHaveBeenCalledWith(MOCK_TENANT_ID, {
        sanityProjectId: PROJECT_ID,
        sanityDataset: tenantSanityDataset,
      });
      expect(callOrder.indexOf('setTenantSanityProject')).toBeGreaterThan(-1);
      expect(callOrder.indexOf('setTenantSanityProject')).toBeLessThan(
        callOrder.indexOf('addSanityCorsOrigin'),
      );
    });

    it('resolves the tenant owner email and invites them as a viewer when not already invited', async () => {
      await createTenantSanityProject(tenant, MOCK_PROVISION_ENV);

      expect(getTenantOwnerEmailMock).toHaveBeenCalledWith(MOCK_TENANT_ID);
      expect(listSanityProjectInvitesMock).toHaveBeenCalledWith({
        token: sanityManagementToken,
        projectId: PROJECT_ID,
      });
      expect(createSanityProjectInviteMock).toHaveBeenCalledTimes(1);
      expect(createSanityProjectInviteMock).toHaveBeenCalledWith({
        token: sanityManagementToken,
        projectId: PROJECT_ID,
        email: MOCK_OWNER_EMAIL,
        role: SANITY_PROJECT_ROLE.VIEWER,
      });
    });

    it('does not invite the platform superadmin, even when the tenant has a resolvable owner', async () => {
      await createTenantSanityProject(tenant, MOCK_PROVISION_ENV);

      expect(createSanityProjectInviteMock).toHaveBeenCalledTimes(1);
      expect(createSanityProjectInviteMock).not.toHaveBeenCalledWith(
        expect.objectContaining({ email: 'superadmin@example.com' }),
      );
    });

    describe('when the owner invite step cannot complete', () => {
      it('skips inviting and logs when the tenant has no resolvable owner email', async () => {
        getTenantOwnerEmailMock.mockImplementation(async () => {
          callOrder.push('getTenantOwnerEmail');
          return undefined;
        });

        const result = await createTenantSanityProject(
          tenant,
          MOCK_PROVISION_ENV,
        );

        expect(listSanityProjectInvitesMock).not.toHaveBeenCalled();
        expect(createSanityProjectInviteMock).not.toHaveBeenCalled();
        expect(result).toEqual({
          sanityProjectId: PROJECT_ID,
          sanityDataset: tenantSanityDataset,
        });
        expect(logger.error).toHaveBeenCalledWith(
          'provisioning.owner_email_missing',
          { tenantId: MOCK_TENANT_ID },
        );
        expect(logger.error).toHaveBeenCalledTimes(1);
      });

      it('does not fail the step when the owner invite is rejected (e.g. a 403 the token cannot grant), returning its normal result', async () => {
        createSanityProjectInviteMock.mockImplementation(async () => {
          callOrder.push('createSanityProjectInvite');
          throw new Error(
            `${HTTP_STATUS.FORBIDDEN} {"statusCode":${HTTP_STATUS.FORBIDDEN},"error":"Forbidden","message":"Missing permission to invite administrators."}`,
          );
        });

        const result = await createTenantSanityProject(
          tenant,
          MOCK_PROVISION_ENV,
        );

        expect(result).toEqual({
          sanityProjectId: PROJECT_ID,
          sanityDataset: tenantSanityDataset,
        });
        expect(setTenantSanityProjectMock).toHaveBeenCalledWith(
          MOCK_TENANT_ID,
          {
            sanityProjectId: PROJECT_ID,
            sanityDataset: tenantSanityDataset,
          },
        );
        expect(createSanityDatasetMock).toHaveBeenCalled();
        expect(addSanityCorsOriginMock).toHaveBeenCalled();
        expect(logger.error).toHaveBeenCalledWith(
          'provisioning.owner_invite_failed',
          expect.objectContaining({
            tenantId: MOCK_TENANT_ID,
            sanityProjectId: PROJECT_ID,
          }),
        );
      });

      it('does not fail the step when listing existing invites throws, and skips sending the invite this run', async () => {
        listSanityProjectInvitesMock.mockImplementation(async () => {
          callOrder.push('listSanityProjectInvites');
          throw new Error('Access API is down');
        });

        const result = await createTenantSanityProject(
          tenant,
          MOCK_PROVISION_ENV,
        );

        expect(result).toEqual({
          sanityProjectId: PROJECT_ID,
          sanityDataset: tenantSanityDataset,
        });
        expect(createSanityProjectInviteMock).not.toHaveBeenCalled();
        expect(logger.error).toHaveBeenCalledWith(
          'provisioning.owner_invites_list_failed',
          expect.objectContaining({ tenantId: MOCK_TENANT_ID }),
        );
      });
    });
  });

  describe('for a tenant whose Sanity project is already persisted', () => {
    let tenant: TTenant;

    beforeEach(() => {
      tenant = baseTenant({
        sanityProjectId: MOCK_SANITY_PROJECT_ID,
        sanityDataset: tenantSanityDataset,
      });
    });

    it('only creates the dataset when the project is already persisted but the dataset is missing', async () => {
      listSanityCorsOriginsMock.mockImplementation(async () => {
        callOrder.push('listSanityCorsOrigins');
        return [{ id: 'cors1', origin: platformAppBaseUrl }];
      });

      const result = await createTenantSanityProject(
        tenant,
        MOCK_PROVISION_ENV,
      );

      expect(createSanityProjectMock).not.toHaveBeenCalled();
      expect(setTenantSanityProjectMock).not.toHaveBeenCalled();
      expect(createSanityDatasetMock).toHaveBeenCalledWith({
        token: sanityManagementToken,
        projectId: MOCK_SANITY_PROJECT_ID,
        dataset: tenantSanityDataset,
      });
      expect(addSanityCorsOriginMock).not.toHaveBeenCalled();
      expect(result).toEqual({
        sanityProjectId: MOCK_SANITY_PROJECT_ID,
        sanityDataset: tenantSanityDataset,
      });
    });

    it('only adds the CORS origin when the project and dataset already exist but the CORS entry is missing', async () => {
      listSanityDatasetsMock.mockImplementation(async () => {
        callOrder.push('listSanityDatasets');
        return [{ name: tenantSanityDataset }];
      });

      const result = await createTenantSanityProject(
        tenant,
        MOCK_PROVISION_ENV,
      );

      expect(createSanityProjectMock).not.toHaveBeenCalled();
      expect(setTenantSanityProjectMock).not.toHaveBeenCalled();
      expect(createSanityDatasetMock).not.toHaveBeenCalled();
      expect(addSanityCorsOriginMock).toHaveBeenCalledWith({
        token: sanityManagementToken,
        projectId: MOCK_SANITY_PROJECT_ID,
        origin: platformAppBaseUrl,
        allowCredentials: true,
      });
      expect(result).toEqual({
        sanityProjectId: MOCK_SANITY_PROJECT_ID,
        sanityDataset: tenantSanityDataset,
      });
    });

    describe('when the dataset and CORS entry already exist', () => {
      beforeEach(() => {
        listSanityDatasetsMock.mockImplementation(async () => {
          callOrder.push('listSanityDatasets');
          return [{ name: tenantSanityDataset }];
        });
        listSanityCorsOriginsMock.mockImplementation(async () => {
          callOrder.push('listSanityCorsOrigins');
          return [{ id: 'cors1', origin: platformAppBaseUrl }];
        });
      });

      it('creates nothing when the project, dataset, CORS entry, and owner invite all already exist', async () => {
        listSanityProjectInvitesMock.mockImplementation(async () => {
          callOrder.push('listSanityProjectInvites');
          return [
            { email: MOCK_OWNER_EMAIL, status: SANITY_PENDING_INVITE_STATUS },
          ];
        });

        const result = await createTenantSanityProject(
          tenant,
          MOCK_PROVISION_ENV,
        );

        expect(result).toEqual({
          sanityProjectId: MOCK_SANITY_PROJECT_ID,
          sanityDataset: tenantSanityDataset,
        });
        expect(createSanityProjectMock).not.toHaveBeenCalled();
        expect(setTenantSanityProjectMock).not.toHaveBeenCalled();
        expect(createSanityDatasetMock).not.toHaveBeenCalled();
        expect(addSanityCorsOriginMock).not.toHaveBeenCalled();
        expect(createSanityProjectInviteMock).not.toHaveBeenCalled();
        expect(listSanityDatasetsMock).toHaveBeenCalledWith({
          token: sanityManagementToken,
          projectId: MOCK_SANITY_PROJECT_ID,
        });
        expect(listSanityCorsOriginsMock).toHaveBeenCalledWith({
          token: sanityManagementToken,
          projectId: MOCK_SANITY_PROJECT_ID,
        });
      });

      it('does not re-invite an owner who already has a pending or accepted invite', async () => {
        listSanityProjectInvitesMock.mockImplementation(async () => {
          callOrder.push('listSanityProjectInvites');
          return [{ email: MOCK_MIXED_CASE_OWNER_EMAIL, status: 'accepted' }];
        });

        await createTenantSanityProject(tenant, MOCK_PROVISION_ENV);

        expect(createSanityProjectInviteMock).not.toHaveBeenCalled();
      });

      it('does not re-invite when a retry finds the owner still pending, exercising the real invite-list parsing against a mocked fetch', async () => {
        const actual = await vi.importActual<typeof SanityProjectAccess>(
          '@blog/db/utils/sanity-management-client/sanity-project-access',
        );
        listSanityProjectInvitesMock.mockImplementation(
          actual.listSanityProjectInvites,
        );
        const fetchMock = vi.fn().mockResolvedValue(
          new Response(
            JSON.stringify({
              data: [
                {
                  email: MOCK_OWNER_EMAIL,
                  status: SANITY_PENDING_INVITE_STATUS,
                },
              ],
              nextCursor: null,
            }),
            { status: HTTP_STATUS.OK },
          ),
        );
        vi.stubGlobal('fetch', fetchMock);

        try {
          await createTenantSanityProject(tenant, MOCK_PROVISION_ENV);

          expect(fetchMock).toHaveBeenCalledWith(
            'https://api.sanity.io/v2026-07-10/access/project/sanity-project-1/invites?status=pending&status=accepted',
            expect.anything(),
          );
          expect(createSanityProjectInviteMock).not.toHaveBeenCalled();
        } finally {
          vi.unstubAllGlobals();
        }
      });
    });
  });
});
