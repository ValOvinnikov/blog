import { SANITY_ROBOT_ROLE } from '@shinefold/config';
import type {
  createSanityRobotToken,
  deleteSanityRobotToken,
} from '@shinefold/db/utils/sanity-management-client/sanity-robot-tokens';
import { buildSanityTokenLabels } from '@shinefold/db/utils/sanity-management-client/sanity-token-labels';
import { requireTenantManagementToken } from '@worker/utils/tenant-management-token/tenant-management-token';

export type TTemporaryWriteTokenDeps = {
  mintWriteToken: typeof createSanityRobotToken;
  revokeWriteToken: typeof deleteSanityRobotToken;
};

export type TTemporaryWriteToken = {
  token: string;
  keep: () => void;
};

// The token is revoked once `run` settles, however it settles, unless `run` called `keep` first.
export async function withTemporaryWriteToken<T>(
  options: {
    tenantId: string;
    projectId: string;
    productName: string;
    deps: TTemporaryWriteTokenDeps;
  },
  run: (writeToken: TTemporaryWriteToken) => Promise<T>,
): Promise<T> {
  const { tenantId, projectId, productName, deps } = options;
  const managementToken = await requireTenantManagementToken(tenantId);
  const minted = await deps.mintWriteToken({
    token: managementToken,
    projectId,
    label: buildSanityTokenLabels(productName).write,
    role: SANITY_ROBOT_ROLE.EDITOR,
  });

  let kept = false;

  try {
    return await run({
      token: minted.token,
      keep: () => {
        kept = true;
      },
    });
  } finally {
    if (!kept) {
      await deps.revokeWriteToken({
        token: managementToken,
        projectId,
        robotId: minted.id,
      });
    }
  }
}
