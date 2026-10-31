import {
  MOCK_DEPROVISION_DRY_RUN_ENV,
  MOCK_DEPROVISION_ENV,
} from '@blog/db/testing/deprovision-tenant/fixtures';
import { MOCK_SANITY_PROJECT_ID } from '@blog/db/testing/sanity-management-client/fixtures';
import {
  MOCK_STEP_ERROR,
  MOCK_TENANT_MANAGEMENT_ROBOT_ID,
  MOCK_TENANT_MANAGEMENT_TOKEN,
  mockTenant,
} from '@blog/db/testing/tenants/fixtures';
import { missingManagementRobotIdMessage } from '@blog/db/utils/sanity-management-client/sanity-robot-revocation';
import { faker } from '@faker-js/faker';

import {
  revokeTenantSanityTokens,
  type TRevokeSanityTokensDeps,
} from './revoke-sanity-tokens';

faker.seed(5765);

const MOCK_TENANT = mockTenant({ sanityProjectId: MOCK_SANITY_PROJECT_ID });
const MOCK_READ_ROBOT = {
  id: faker.string.uuid(),
  label: faker.lorem.words(2),
};
const MOCK_WRITE_ROBOT = {
  id: faker.string.uuid(),
  label: faker.lorem.words(2),
};
const MOCK_MANAGEMENT_ROBOT = {
  id: MOCK_TENANT_MANAGEMENT_ROBOT_ID,
  label: faker.company.name(),
};
const MOCK_HAND_MADE_ROBOT = {
  id: faker.string.uuid(),
  label: faker.internet.email(),
};
const MOCK_CREDENTIALS = {
  projectId: MOCK_SANITY_PROJECT_ID,
  token: MOCK_TENANT_MANAGEMENT_TOKEN,
  managementRobotId: MOCK_TENANT_MANAGEMENT_ROBOT_ID,
};

const getManagementCredentials =
  vi.fn<TRevokeSanityTokensDeps['getManagementCredentials']>();
const listRobotTokens = vi.fn<TRevokeSanityTokensDeps['listRobotTokens']>();
const revokeToken = vi.fn<TRevokeSanityTokensDeps['revokeToken']>();
const MOCK_DEPS: TRevokeSanityTokensDeps = {
  getManagementCredentials,
  listRobotTokens,
  revokeToken,
};

function revokedRobotIds(): string[] {
  return revokeToken.mock.calls.map(([{ robotId }]) => robotId);
}

beforeEach(() => {
  getManagementCredentials.mockResolvedValue(MOCK_CREDENTIALS);
});

describe(revokeTenantSanityTokens, () => {
  it('skips when no Sanity project id is set', async () => {
    await revokeTenantSanityTokens(
      { ...MOCK_TENANT, sanityProjectId: null },
      MOCK_DEPROVISION_ENV,
      MOCK_DEPS,
    );

    expect(listRobotTokens).not.toHaveBeenCalled();
  });

  it('does not call the API in dry-run mode', async () => {
    await revokeTenantSanityTokens(
      MOCK_TENANT,
      MOCK_DEPROVISION_DRY_RUN_ENV,
      MOCK_DEPS,
    );

    expect(listRobotTokens).not.toHaveBeenCalled();
    expect(revokeToken).not.toHaveBeenCalled();
  });

  it('revokes every robot on the project, using the tenant management token', async () => {
    listRobotTokens.mockResolvedValueOnce([
      MOCK_READ_ROBOT,
      MOCK_WRITE_ROBOT,
      MOCK_HAND_MADE_ROBOT,
    ]);

    await revokeTenantSanityTokens(
      MOCK_TENANT,
      MOCK_DEPROVISION_ENV,
      MOCK_DEPS,
    );

    expect(listRobotTokens).toHaveBeenCalledWith({
      token: MOCK_TENANT_MANAGEMENT_TOKEN,
      projectId: MOCK_TENANT.sanityProjectId,
    });
    expect(revokeToken).toHaveBeenCalledWith({
      token: MOCK_TENANT_MANAGEMENT_TOKEN,
      projectId: MOCK_TENANT.sanityProjectId,
      robotId: MOCK_READ_ROBOT.id,
    });
    expect(revokedRobotIds()).toEqual([
      MOCK_READ_ROBOT.id,
      MOCK_WRITE_ROBOT.id,
      MOCK_HAND_MADE_ROBOT.id,
    ]);
  });

  it('revokes the management token last, identified by its stored robot id', async () => {
    listRobotTokens.mockResolvedValueOnce([
      MOCK_MANAGEMENT_ROBOT,
      MOCK_READ_ROBOT,
      MOCK_HAND_MADE_ROBOT,
      MOCK_WRITE_ROBOT,
    ]);

    await revokeTenantSanityTokens(
      MOCK_TENANT,
      MOCK_DEPROVISION_ENV,
      MOCK_DEPS,
    );

    expect(revokedRobotIds()).toEqual([
      MOCK_READ_ROBOT.id,
      MOCK_HAND_MADE_ROBOT.id,
      MOCK_WRITE_ROBOT.id,
      MOCK_MANAGEMENT_ROBOT.id,
    ]);
  });

  it('resolves without calling Sanity when the tenant has no management token', async () => {
    getManagementCredentials.mockResolvedValueOnce(undefined);

    await expect(
      revokeTenantSanityTokens(MOCK_TENANT, MOCK_DEPROVISION_ENV, MOCK_DEPS),
    ).resolves.toBeUndefined();

    expect(listRobotTokens).not.toHaveBeenCalled();
    expect(revokeToken).not.toHaveBeenCalled();
  });

  it('throws and revokes nothing when the tenant has no stored management robot id', async () => {
    getManagementCredentials.mockResolvedValueOnce({
      ...MOCK_CREDENTIALS,
      managementRobotId: null,
    });

    await expect(
      revokeTenantSanityTokens(MOCK_TENANT, MOCK_DEPROVISION_ENV, MOCK_DEPS),
    ).rejects.toThrow(missingManagementRobotIdMessage(MOCK_TENANT.id));

    expect(listRobotTokens).not.toHaveBeenCalled();
    expect(revokeToken).not.toHaveBeenCalled();
  });

  it('still attempts the other token when one revocation fails', async () => {
    listRobotTokens.mockResolvedValueOnce([MOCK_READ_ROBOT, MOCK_WRITE_ROBOT]);
    revokeToken.mockRejectedValueOnce(new Error(MOCK_STEP_ERROR));

    await expect(
      revokeTenantSanityTokens(MOCK_TENANT, MOCK_DEPROVISION_ENV, MOCK_DEPS),
    ).resolves.toBeUndefined();

    expect(revokeToken).toHaveBeenCalledTimes(2);
  });

  it('resolves without revoking when listing the project robots fails', async () => {
    listRobotTokens.mockRejectedValueOnce(new Error(MOCK_STEP_ERROR));

    await expect(
      revokeTenantSanityTokens(MOCK_TENANT, MOCK_DEPROVISION_ENV, MOCK_DEPS),
    ).resolves.toBeUndefined();

    expect(revokeToken).not.toHaveBeenCalled();
  });
});
