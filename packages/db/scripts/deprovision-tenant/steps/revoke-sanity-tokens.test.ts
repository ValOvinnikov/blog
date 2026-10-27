import {
  MOCK_DEPROVISION_DRY_RUN_ENV,
  MOCK_DEPROVISION_ENV,
} from '@blog/db/testing/deprovision-tenant/fixtures';
import { MOCK_STEP_ERROR, mockTenant } from '@blog/db/testing/tenants/fixtures';
import {
  SANITY_READ_TOKEN_LABEL,
  SANITY_WRITE_TOKEN_LABEL,
} from '@blog/db/utils/sanity-management-client/sanity-token-labels';
import { faker } from '@faker-js/faker';

import {
  revokeTenantSanityTokens,
  type TRevokeSanityTokensDeps,
} from './revoke-sanity-tokens';

faker.seed(5765);

const MOCK_TENANT = mockTenant();
const MOCK_READ_ROBOT = {
  id: faker.string.uuid(),
  label: SANITY_READ_TOKEN_LABEL,
};
const MOCK_WRITE_ROBOT = {
  id: faker.string.uuid(),
  label: SANITY_WRITE_TOKEN_LABEL,
};
const MOCK_HUMAN_ROBOT = {
  id: faker.string.uuid(),
  label: faker.internet.email(),
};

const listRobotTokens = vi.fn<TRevokeSanityTokensDeps['listRobotTokens']>();
const revokeToken = vi.fn<TRevokeSanityTokensDeps['revokeToken']>();
const MOCK_DEPS: TRevokeSanityTokensDeps = { listRobotTokens, revokeToken };

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

  it('revokes only the provisioned read and write tokens', async () => {
    listRobotTokens.mockResolvedValueOnce([
      MOCK_READ_ROBOT,
      MOCK_WRITE_ROBOT,
      MOCK_HUMAN_ROBOT,
    ]);

    await revokeTenantSanityTokens(
      MOCK_TENANT,
      MOCK_DEPROVISION_ENV,
      MOCK_DEPS,
    );

    expect(listRobotTokens).toHaveBeenCalledWith({
      token: MOCK_DEPROVISION_ENV.sanityManagementToken,
      projectId: MOCK_TENANT.sanityProjectId,
    });
    expect(revokeToken.mock.calls).toEqual([
      [
        {
          token: MOCK_DEPROVISION_ENV.sanityManagementToken,
          projectId: MOCK_TENANT.sanityProjectId,
          robotId: MOCK_READ_ROBOT.id,
        },
      ],
      [
        {
          token: MOCK_DEPROVISION_ENV.sanityManagementToken,
          projectId: MOCK_TENANT.sanityProjectId,
          robotId: MOCK_WRITE_ROBOT.id,
        },
      ],
    ]);
  });

  it('revokes nothing when no robot matches a provisioned label', async () => {
    listRobotTokens.mockResolvedValueOnce([MOCK_HUMAN_ROBOT]);

    await revokeTenantSanityTokens(
      MOCK_TENANT,
      MOCK_DEPROVISION_ENV,
      MOCK_DEPS,
    );

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
