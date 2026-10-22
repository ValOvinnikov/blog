import { HTTP_STATUS, SANITY_PROJECT_ROLE } from '@blog/config';
import { LOCALE_ISO_CODES } from '@blog/config/constants';
import {
  TENANT_PLAN,
  TENANT_PROVISIONING_STATUS,
  TENANT_STATUS,
} from '@blog/db/constants';
import type { TTenant } from '@blog/db/schema/tenants';
import type * as SanityProjectAccess from '@blog/db/utils/sanity-management-client/sanity-project-access';
import { logger } from '@worker/utils/logger/logger';
import type { TProvisionEnv } from '@worker/utils/provision-env/provision-env';

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

const MANAGEMENT_TOKEN = 'mgmt-token';
const TENANT_DATASET = 'test-dataset';
const ADMIN_APP_BASE_URL = 'https://admin.example.com';
const PROJECT_ID = 'proj456';
const TENANT_ID = 'tenant-1';
const OWNER_EMAIL = 'owner@example.com';

const env: TProvisionEnv = {
  sanityManagementToken: MANAGEMENT_TOKEN,
  sanityOrganizationId: 'org-abc',
  vercelToken: 'v-token',
  vercelTeamId: undefined,
  vercelWebProjectId: 'prj_web',
  adminAppBaseUrl: ADMIN_APP_BASE_URL,
  tenantSanityDataset: TENANT_DATASET,
  webAppBaseUrl: 'https://example.com',
  revalidateSecret: 'revalidate-shh',
};

function baseTenant(overrides: Partial<TTenant> = {}): TTenant {
  return {
    id: TENANT_ID,
    name: 'Acme',
    primaryDomain: 'acme.example.com',
    sanityProjectId: null,
    sanityDataset: null,
    sanityReadTokenEncrypted: null,
    locale: LOCALE_ISO_CODES.EN,
    plan: TENANT_PLAN.FREE,
    status: TENANT_STATUS.ACTIVE,
    provisioningStatus: TENANT_PROVISIONING_STATUS.PENDING,
    provisioningSteps: null,
    seededAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as TTenant;
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
    return OWNER_EMAIL;
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
      const result = await createTenantSanityProject(tenant, env);

      expect(createSanityProjectMock).toHaveBeenCalledWith({
        token: MANAGEMENT_TOKEN,
        displayName: 'Acme',
        organizationId: 'org-abc',
      });
      expect(setTenantSanityProjectMock).toHaveBeenCalledWith(TENANT_ID, {
        sanityProjectId: PROJECT_ID,
        sanityDataset: TENANT_DATASET,
      });
      expect(createSanityDatasetMock).toHaveBeenCalledWith({
        token: MANAGEMENT_TOKEN,
        projectId: PROJECT_ID,
        dataset: TENANT_DATASET,
      });
      expect(addSanityCorsOriginMock).toHaveBeenCalledWith({
        token: MANAGEMENT_TOKEN,
        projectId: PROJECT_ID,
        origin: ADMIN_APP_BASE_URL,
        allowCredentials: true,
      });
      expect(result).toEqual({
        sanityProjectId: PROJECT_ID,
        sanityDataset: TENANT_DATASET,
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

      await expect(createTenantSanityProject(tenant, env)).rejects.toThrow(
        /CORS API is down/,
      );

      expect(setTenantSanityProjectMock).toHaveBeenCalledWith(TENANT_ID, {
        sanityProjectId: PROJECT_ID,
        sanityDataset: TENANT_DATASET,
      });
      expect(callOrder.indexOf('setTenantSanityProject')).toBeGreaterThan(-1);
      expect(callOrder.indexOf('setTenantSanityProject')).toBeLessThan(
        callOrder.indexOf('addSanityCorsOrigin'),
      );
    });

    it('resolves the tenant owner email and invites them as a viewer when not already invited', async () => {
      await createTenantSanityProject(tenant, env);

      expect(getTenantOwnerEmailMock).toHaveBeenCalledWith(TENANT_ID);
      expect(listSanityProjectInvitesMock).toHaveBeenCalledWith({
        token: MANAGEMENT_TOKEN,
        projectId: PROJECT_ID,
      });
      expect(createSanityProjectInviteMock).toHaveBeenCalledTimes(1);
      expect(createSanityProjectInviteMock).toHaveBeenCalledWith({
        token: MANAGEMENT_TOKEN,
        projectId: PROJECT_ID,
        email: OWNER_EMAIL,
        role: SANITY_PROJECT_ROLE.VIEWER,
      });
    });

    it('does not invite the platform superadmin, even when the tenant has a resolvable owner', async () => {
      await createTenantSanityProject(tenant, env);

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

        const result = await createTenantSanityProject(tenant, env);

        expect(listSanityProjectInvitesMock).not.toHaveBeenCalled();
        expect(createSanityProjectInviteMock).not.toHaveBeenCalled();
        expect(result).toEqual({
          sanityProjectId: PROJECT_ID,
          sanityDataset: TENANT_DATASET,
        });
        expect(logger.error).toHaveBeenCalledWith(
          'provisioning.owner_email_missing',
          { tenantId: TENANT_ID },
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

        const result = await createTenantSanityProject(tenant, env);

        expect(result).toEqual({
          sanityProjectId: PROJECT_ID,
          sanityDataset: TENANT_DATASET,
        });
        expect(setTenantSanityProjectMock).toHaveBeenCalledWith(TENANT_ID, {
          sanityProjectId: PROJECT_ID,
          sanityDataset: TENANT_DATASET,
        });
        expect(createSanityDatasetMock).toHaveBeenCalled();
        expect(addSanityCorsOriginMock).toHaveBeenCalled();
        expect(logger.error).toHaveBeenCalledWith(
          'provisioning.owner_invite_failed',
          expect.objectContaining({
            tenantId: TENANT_ID,
            sanityProjectId: PROJECT_ID,
          }),
        );
      });

      it('does not fail the step when listing existing invites throws, and skips sending the invite this run', async () => {
        listSanityProjectInvitesMock.mockImplementation(async () => {
          callOrder.push('listSanityProjectInvites');
          throw new Error('Access API is down');
        });

        const result = await createTenantSanityProject(tenant, env);

        expect(result).toEqual({
          sanityProjectId: PROJECT_ID,
          sanityDataset: TENANT_DATASET,
        });
        expect(createSanityProjectInviteMock).not.toHaveBeenCalled();
        expect(logger.error).toHaveBeenCalledWith(
          'provisioning.owner_invites_list_failed',
          expect.objectContaining({ tenantId: TENANT_ID }),
        );
      });
    });
  });

  describe('for a tenant whose Sanity project is already persisted', () => {
    let tenant: TTenant;

    beforeEach(() => {
      tenant = baseTenant({
        sanityProjectId: 'proj123',
        sanityDataset: TENANT_DATASET,
      });
    });

    it('only creates the dataset when the project is already persisted but the dataset is missing', async () => {
      listSanityCorsOriginsMock.mockImplementation(async () => {
        callOrder.push('listSanityCorsOrigins');
        return [{ id: 'cors1', origin: ADMIN_APP_BASE_URL }];
      });

      const result = await createTenantSanityProject(tenant, env);

      expect(createSanityProjectMock).not.toHaveBeenCalled();
      expect(setTenantSanityProjectMock).not.toHaveBeenCalled();
      expect(createSanityDatasetMock).toHaveBeenCalledWith({
        token: MANAGEMENT_TOKEN,
        projectId: 'proj123',
        dataset: TENANT_DATASET,
      });
      expect(addSanityCorsOriginMock).not.toHaveBeenCalled();
      expect(result).toEqual({
        sanityProjectId: 'proj123',
        sanityDataset: TENANT_DATASET,
      });
    });

    it('only adds the CORS origin when the project and dataset already exist but the CORS entry is missing', async () => {
      listSanityDatasetsMock.mockImplementation(async () => {
        callOrder.push('listSanityDatasets');
        return [{ name: TENANT_DATASET }];
      });

      const result = await createTenantSanityProject(tenant, env);

      expect(createSanityProjectMock).not.toHaveBeenCalled();
      expect(setTenantSanityProjectMock).not.toHaveBeenCalled();
      expect(createSanityDatasetMock).not.toHaveBeenCalled();
      expect(addSanityCorsOriginMock).toHaveBeenCalledWith({
        token: MANAGEMENT_TOKEN,
        projectId: 'proj123',
        origin: ADMIN_APP_BASE_URL,
        allowCredentials: true,
      });
      expect(result).toEqual({
        sanityProjectId: 'proj123',
        sanityDataset: TENANT_DATASET,
      });
    });

    describe('when the dataset and CORS entry already exist', () => {
      beforeEach(() => {
        listSanityDatasetsMock.mockImplementation(async () => {
          callOrder.push('listSanityDatasets');
          return [{ name: TENANT_DATASET }];
        });
        listSanityCorsOriginsMock.mockImplementation(async () => {
          callOrder.push('listSanityCorsOrigins');
          return [{ id: 'cors1', origin: ADMIN_APP_BASE_URL }];
        });
      });

      it('creates nothing when the project, dataset, CORS entry, and owner invite all already exist', async () => {
        listSanityProjectInvitesMock.mockImplementation(async () => {
          callOrder.push('listSanityProjectInvites');
          return [{ email: OWNER_EMAIL, status: 'pending' }];
        });

        const result = await createTenantSanityProject(tenant, env);

        expect(result).toEqual({
          sanityProjectId: 'proj123',
          sanityDataset: TENANT_DATASET,
        });
        expect(createSanityProjectMock).not.toHaveBeenCalled();
        expect(setTenantSanityProjectMock).not.toHaveBeenCalled();
        expect(createSanityDatasetMock).not.toHaveBeenCalled();
        expect(addSanityCorsOriginMock).not.toHaveBeenCalled();
        expect(createSanityProjectInviteMock).not.toHaveBeenCalled();
        expect(listSanityDatasetsMock).toHaveBeenCalledWith({
          token: MANAGEMENT_TOKEN,
          projectId: 'proj123',
        });
        expect(listSanityCorsOriginsMock).toHaveBeenCalledWith({
          token: MANAGEMENT_TOKEN,
          projectId: 'proj123',
        });
      });

      it('does not re-invite an owner who already has a pending or accepted invite', async () => {
        listSanityProjectInvitesMock.mockImplementation(async () => {
          callOrder.push('listSanityProjectInvites');
          return [{ email: 'Owner@Example.com', status: 'accepted' }];
        });

        await createTenantSanityProject(tenant, env);

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
              data: [{ email: OWNER_EMAIL, status: 'pending' }],
              nextCursor: null,
            }),
            { status: HTTP_STATUS.OK },
          ),
        );
        vi.stubGlobal('fetch', fetchMock);

        try {
          await createTenantSanityProject(tenant, env);

          expect(fetchMock).toHaveBeenCalledWith(
            'https://api.sanity.io/v2026-07-10/access/project/proj123/invites?status=pending&status=accepted',
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
