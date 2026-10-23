import { MOCK_DEPROVISION_ENV } from '@blog/db/testing/deprovision-tenant/fixtures';
import { mockTenant } from '@blog/db/testing/tenants/fixtures';
import {
  SANITY_READ_TOKEN_LABEL,
  SANITY_WRITE_TOKEN_LABEL,
} from '@blog/db/utils/sanity-management-client/sanity-token-labels';

import {
  revokeTenantSanityTokens,
  type TRevokeSanityTokensDeps,
} from './revoke-sanity-tokens';

const MOCK_TENANT = mockTenant();
const MOCK_SANITY_PROJECT_ID = MOCK_TENANT.sanityProjectId;
const MOCK_REVOKE_ERROR = 'network error';
const MOCK_READ_ROBOT = { id: 'robot-read', label: SANITY_READ_TOKEN_LABEL };
const MOCK_WRITE_ROBOT = { id: 'robot-write', label: SANITY_WRITE_TOKEN_LABEL };
const MOCK_HUMAN_ROBOT = { id: 'robot-human', label: 'someone@example.com' };

function deps(
  overrides: Partial<TRevokeSanityTokensDeps> = {},
): TRevokeSanityTokensDeps {
  return {
    listRobotTokens: vi.fn().mockResolvedValue([]),
    revokeToken: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe(revokeTenantSanityTokens, () => {
  describe('with default deps', () => {
    let testDeps: TRevokeSanityTokensDeps;

    beforeEach(() => {
      testDeps = deps();
    });

    it('skips when no Sanity project id is set', async () => {
      await revokeTenantSanityTokens(
        { ...MOCK_TENANT, sanityProjectId: null },
        MOCK_DEPROVISION_ENV,
        testDeps,
      );

      expect(testDeps.listRobotTokens).not.toHaveBeenCalled();
    });

    it('does not call the API in dry-run mode', async () => {
      await revokeTenantSanityTokens(
        MOCK_TENANT,
        { ...MOCK_DEPROVISION_ENV, dryRun: true },
        testDeps,
      );

      expect(testDeps.listRobotTokens).not.toHaveBeenCalled();
      expect(testDeps.revokeToken).not.toHaveBeenCalled();
    });
  });

  it('lists the project robots and deletes only the provisioned read/write tokens by label', async () => {
    const testDeps = deps({
      listRobotTokens: vi
        .fn()
        .mockResolvedValue([
          MOCK_READ_ROBOT,
          MOCK_WRITE_ROBOT,
          MOCK_HUMAN_ROBOT,
        ]),
    });

    await revokeTenantSanityTokens(MOCK_TENANT, MOCK_DEPROVISION_ENV, testDeps);

    expect(testDeps.listRobotTokens).toHaveBeenCalledWith({
      token: MOCK_DEPROVISION_ENV.sanityManagementToken,
      projectId: MOCK_SANITY_PROJECT_ID,
    });
    expect(testDeps.revokeToken).toHaveBeenCalledTimes(2);
    expect(testDeps.revokeToken).toHaveBeenCalledWith({
      token: MOCK_DEPROVISION_ENV.sanityManagementToken,
      projectId: MOCK_SANITY_PROJECT_ID,
      robotId: MOCK_READ_ROBOT.id,
    });
    expect(testDeps.revokeToken).toHaveBeenCalledWith({
      token: MOCK_DEPROVISION_ENV.sanityManagementToken,
      projectId: MOCK_SANITY_PROJECT_ID,
      robotId: MOCK_WRITE_ROBOT.id,
    });
  });

  it('does nothing when no robot matches a provisioned label', async () => {
    const testDeps = deps({
      listRobotTokens: vi.fn().mockResolvedValue([MOCK_HUMAN_ROBOT]),
    });

    await revokeTenantSanityTokens(MOCK_TENANT, MOCK_DEPROVISION_ENV, testDeps);

    expect(testDeps.revokeToken).not.toHaveBeenCalled();
  });

  it('does not throw and still attempts the other matched token when one deletion fails', async () => {
    const revokeToken = vi
      .fn()
      .mockRejectedValueOnce(new Error(MOCK_REVOKE_ERROR))
      .mockResolvedValueOnce(undefined);
    const testDeps = deps({
      listRobotTokens: vi
        .fn()
        .mockResolvedValue([MOCK_READ_ROBOT, MOCK_WRITE_ROBOT]),
      revokeToken,
    });

    await expect(
      revokeTenantSanityTokens(MOCK_TENANT, MOCK_DEPROVISION_ENV, testDeps),
    ).resolves.toBeUndefined();

    expect(revokeToken).toHaveBeenCalledTimes(2);
  });

  it('does not throw when listing the project robots fails', async () => {
    const testDeps = deps({
      listRobotTokens: vi.fn().mockRejectedValue(new Error(MOCK_REVOKE_ERROR)),
    });

    await expect(
      revokeTenantSanityTokens(MOCK_TENANT, MOCK_DEPROVISION_ENV, testDeps),
    ).resolves.toBeUndefined();

    expect(testDeps.revokeToken).not.toHaveBeenCalled();
  });
});
