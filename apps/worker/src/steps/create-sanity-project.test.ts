import { HTTP_STATUS, SANITY_PROJECT_ROLE } from '@blog/config';
import { TENANT_PROVISIONING_STATUS } from '@blog/db/constants';
import { getTenantOwnerEmail } from '@blog/db/queries/memberships';
import { setTenantSanityProject } from '@blog/db/queries/tenants';
import type { TTenant } from '@blog/db/schema/tenants';
import {
  createSanityProjectInvite,
  listSanityProjectInvites,
} from '@blog/db/utils/sanity-management-client/sanity-project-access';
import {
  addSanityCorsOrigin,
  createSanityDataset,
  createSanityProject,
  listSanityCorsOrigins,
  listSanityDatasets,
} from '@blog/db/utils/sanity-management-client/sanity-project-setup';
import { faker } from '@faker-js/faker';
import { SANITY_PENDING_INVITE_STATUS } from '@worker/constants/owner-access';
import { MOCK_SANITY_OUTAGE } from '@worker/testing/outage/fixtures';
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

faker.seed(7004);

vi.mock('@blog/db/queries/tenants');
vi.mock('@blog/db/queries/memberships');
vi.mock('@blog/db/utils/sanity-management-client/sanity-project-setup');
vi.mock('@blog/db/utils/sanity-management-client/sanity-project-access');

const MOCK_CREATED_PROJECT_ID = faker.string.alphanumeric(8);
const MOCK_CORS_ORIGIN_ID = faker.string.uuid();
const {
  sanityManagementToken,
  sanityOrganizationId,
  platformAppBaseUrl,
  tenantSanityDataset,
} = MOCK_PROVISION_ENV;
const MOCK_CREATED_PROJECT = {
  sanityProjectId: MOCK_CREATED_PROJECT_ID,
  sanityDataset: tenantSanityDataset,
};
const MOCK_EXISTING_PROJECT = {
  sanityProjectId: MOCK_SANITY_PROJECT_ID,
  sanityDataset: tenantSanityDataset,
};
const MOCK_EXISTING_DATASETS = [{ name: tenantSanityDataset }];
const MOCK_EXISTING_CORS_ORIGINS = [
  { id: MOCK_CORS_ORIGIN_ID, origin: platformAppBaseUrl },
];

function baseTenant(overrides: Partial<TTenant> = {}): TTenant {
  return mockTenant({
    provisioningStatus: TENANT_PROVISIONING_STATUS.PENDING,
    ...overrides,
  });
}

function firstCallOrder(calls: { invocationCallOrder: number[] }): number {
  return calls.invocationCallOrder[0] ?? Number.NaN;
}

describe(createTenantSanityProject, () => {
  beforeEach(() => {
    vi.mocked(createSanityProject).mockResolvedValue({
      id: MOCK_CREATED_PROJECT_ID,
    });
    vi.mocked(getTenantOwnerEmail).mockResolvedValue(MOCK_OWNER_EMAIL);
    vi.mocked(listSanityDatasets).mockResolvedValue([]);
    vi.mocked(listSanityCorsOrigins).mockResolvedValue([]);
    vi.mocked(listSanityProjectInvites).mockResolvedValue([]);
  });

  describe('for a tenant with no Sanity project yet', () => {
    let tenant: TTenant;

    beforeEach(() => {
      tenant = baseTenant();
    });

    it('creates the project, dataset, and CORS origin and returns the project', async () => {
      const result = await createTenantSanityProject(
        tenant,
        MOCK_PROVISION_ENV,
      );

      expect(createSanityProject).toHaveBeenCalledWith({
        token: sanityManagementToken,
        displayName: tenant.name,
        organizationId: sanityOrganizationId,
      });
      expect(createSanityDataset).toHaveBeenCalledWith({
        token: sanityManagementToken,
        projectId: MOCK_CREATED_PROJECT_ID,
        dataset: tenantSanityDataset,
      });
      expect(addSanityCorsOrigin).toHaveBeenCalledWith({
        token: sanityManagementToken,
        projectId: MOCK_CREATED_PROJECT_ID,
        origin: platformAppBaseUrl,
        allowCredentials: true,
      });
      expect(result).toEqual(MOCK_CREATED_PROJECT);
    });

    it('persists the project immediately after creating it', async () => {
      await createTenantSanityProject(tenant, MOCK_PROVISION_ENV);

      const created = firstCallOrder(vi.mocked(createSanityProject).mock);
      const persisted = firstCallOrder(vi.mocked(setTenantSanityProject).mock);
      const datasetCreated = firstCallOrder(
        vi.mocked(createSanityDataset).mock,
      );
      const corsAdded = firstCallOrder(vi.mocked(addSanityCorsOrigin).mock);
      expect(setTenantSanityProject).toHaveBeenCalledWith(
        MOCK_TENANT_ID,
        MOCK_CREATED_PROJECT,
      );
      expect(created).toBeLessThan(persisted);
      expect(persisted).toBeLessThan(datasetCreated);
      expect(persisted).toBeLessThan(corsAdded);
    });

    it('persists the created project before a later CORS failure propagates', async () => {
      vi.mocked(addSanityCorsOrigin).mockRejectedValue(
        new Error(MOCK_SANITY_OUTAGE),
      );

      await expect(
        createTenantSanityProject(tenant, MOCK_PROVISION_ENV),
      ).rejects.toThrow(MOCK_SANITY_OUTAGE);

      expect(setTenantSanityProject).toHaveBeenCalledWith(
        MOCK_TENANT_ID,
        MOCK_CREATED_PROJECT,
      );
    });

    it('invites the tenant owner as a viewer when not already invited', async () => {
      await createTenantSanityProject(tenant, MOCK_PROVISION_ENV);

      expect(getTenantOwnerEmail).toHaveBeenCalledWith(MOCK_TENANT_ID);
      expect(listSanityProjectInvites).toHaveBeenCalledWith({
        token: sanityManagementToken,
        projectId: MOCK_CREATED_PROJECT_ID,
      });
      expect(createSanityProjectInvite).toHaveBeenCalledOnce();
      expect(createSanityProjectInvite).toHaveBeenCalledWith({
        token: sanityManagementToken,
        projectId: MOCK_CREATED_PROJECT_ID,
        email: MOCK_OWNER_EMAIL,
        role: SANITY_PROJECT_ROLE.VIEWER,
      });
    });

    describe('when the owner invite step cannot complete', () => {
      it('skips inviting and logs when the tenant has no owner email', async () => {
        vi.mocked(getTenantOwnerEmail).mockResolvedValue(undefined);

        const result = await createTenantSanityProject(
          tenant,
          MOCK_PROVISION_ENV,
        );

        expect(listSanityProjectInvites).not.toHaveBeenCalled();
        expect(createSanityProjectInvite).not.toHaveBeenCalled();
        expect(result).toEqual(MOCK_CREATED_PROJECT);
        expect(logger.error).toHaveBeenCalledWith(
          'provisioning.owner_email_missing',
          { tenantId: MOCK_TENANT_ID },
        );
        expect(logger.error).toHaveBeenCalledTimes(1);
      });

      it('keeps the step successful when the owner invite is rejected', async () => {
        vi.mocked(createSanityProjectInvite).mockRejectedValue(
          new Error(`${HTTP_STATUS.FORBIDDEN} ${MOCK_SANITY_OUTAGE}`),
        );

        const result = await createTenantSanityProject(
          tenant,
          MOCK_PROVISION_ENV,
        );

        const [event, context] = vi.mocked(logger.error).mock.lastCall ?? [];
        expect(result).toEqual(MOCK_CREATED_PROJECT);
        expect(setTenantSanityProject).toHaveBeenCalledWith(
          MOCK_TENANT_ID,
          MOCK_CREATED_PROJECT,
        );
        expect(createSanityDataset).toHaveBeenCalled();
        expect(addSanityCorsOrigin).toHaveBeenCalled();
        expect(event).toBe('provisioning.owner_invite_failed');
        expect(context?.tenantId).toBe(MOCK_TENANT_ID);
        expect(context?.sanityProjectId).toBe(MOCK_CREATED_PROJECT_ID);
      });

      it('skips the invite when listing existing invites throws', async () => {
        vi.mocked(listSanityProjectInvites).mockRejectedValue(
          new Error(MOCK_SANITY_OUTAGE),
        );

        const result = await createTenantSanityProject(
          tenant,
          MOCK_PROVISION_ENV,
        );

        const [event, context] = vi.mocked(logger.error).mock.lastCall ?? [];
        expect(result).toEqual(MOCK_CREATED_PROJECT);
        expect(createSanityProjectInvite).not.toHaveBeenCalled();
        expect(event).toBe('provisioning.owner_invites_list_failed');
        expect(context?.tenantId).toBe(MOCK_TENANT_ID);
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

    it('only creates the dataset when the dataset is missing', async () => {
      vi.mocked(listSanityCorsOrigins).mockResolvedValue(
        MOCK_EXISTING_CORS_ORIGINS,
      );

      const result = await createTenantSanityProject(
        tenant,
        MOCK_PROVISION_ENV,
      );

      expect(createSanityProject).not.toHaveBeenCalled();
      expect(setTenantSanityProject).not.toHaveBeenCalled();
      expect(createSanityDataset).toHaveBeenCalledWith({
        token: sanityManagementToken,
        projectId: MOCK_SANITY_PROJECT_ID,
        dataset: tenantSanityDataset,
      });
      expect(addSanityCorsOrigin).not.toHaveBeenCalled();
      expect(result).toEqual(MOCK_EXISTING_PROJECT);
    });

    it('only adds the CORS origin when the CORS entry is missing', async () => {
      vi.mocked(listSanityDatasets).mockResolvedValue(MOCK_EXISTING_DATASETS);

      const result = await createTenantSanityProject(
        tenant,
        MOCK_PROVISION_ENV,
      );

      expect(createSanityProject).not.toHaveBeenCalled();
      expect(setTenantSanityProject).not.toHaveBeenCalled();
      expect(createSanityDataset).not.toHaveBeenCalled();
      expect(addSanityCorsOrigin).toHaveBeenCalledWith({
        token: sanityManagementToken,
        projectId: MOCK_SANITY_PROJECT_ID,
        origin: platformAppBaseUrl,
        allowCredentials: true,
      });
      expect(result).toEqual(MOCK_EXISTING_PROJECT);
    });

    describe('when the dataset and CORS entry already exist', () => {
      beforeEach(() => {
        vi.mocked(listSanityDatasets).mockResolvedValue(MOCK_EXISTING_DATASETS);
        vi.mocked(listSanityCorsOrigins).mockResolvedValue(
          MOCK_EXISTING_CORS_ORIGINS,
        );
      });

      it('creates nothing when everything, owner invite included, already exists', async () => {
        vi.mocked(listSanityProjectInvites).mockResolvedValue([
          {
            id: faker.string.uuid(),
            email: MOCK_OWNER_EMAIL,
            status: SANITY_PENDING_INVITE_STATUS,
          },
        ]);

        const result = await createTenantSanityProject(
          tenant,
          MOCK_PROVISION_ENV,
        );

        expect(result).toEqual(MOCK_EXISTING_PROJECT);
        expect(createSanityProject).not.toHaveBeenCalled();
        expect(setTenantSanityProject).not.toHaveBeenCalled();
        expect(createSanityDataset).not.toHaveBeenCalled();
        expect(addSanityCorsOrigin).not.toHaveBeenCalled();
        expect(createSanityProjectInvite).not.toHaveBeenCalled();
        expect(listSanityDatasets).toHaveBeenCalledWith({
          token: sanityManagementToken,
          projectId: MOCK_SANITY_PROJECT_ID,
        });
        expect(listSanityCorsOrigins).toHaveBeenCalledWith({
          token: sanityManagementToken,
          projectId: MOCK_SANITY_PROJECT_ID,
        });
      });

      it('does not re-invite an owner with a pending or accepted invite', async () => {
        vi.mocked(listSanityProjectInvites).mockResolvedValue([
          {
            id: faker.string.uuid(),
            email: MOCK_MIXED_CASE_OWNER_EMAIL,
            status: 'accepted',
          },
        ]);

        await createTenantSanityProject(tenant, MOCK_PROVISION_ENV);

        expect(createSanityProjectInvite).not.toHaveBeenCalled();
      });
    });
  });
});
