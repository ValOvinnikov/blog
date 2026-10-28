import type { TMaybeUndefined } from '@blog/config';
import {
  RELEASE_LOG,
  TENANT_MIGRATION_WORKFLOW_FILE,
  type TMigrationEnvironment,
} from '@platform/constants/release';
import { dispatchGitHubWorkflow } from '@platform/server/github/dispatch-github-workflow';

type TDispatchTenantMigrationWorkflowInput = {
  environment: TMigrationEnvironment;
  tenantId: TMaybeUndefined<string>;
};

export const dispatchTenantMigrationWorkflow = ({
  environment,
  tenantId,
}: TDispatchTenantMigrationWorkflowInput): Promise<boolean> =>
  dispatchGitHubWorkflow({
    workflowFile: TENANT_MIGRATION_WORKFLOW_FILE,
    inputs: { environment, tenantId },
    logEvents: {
      skipped: RELEASE_LOG.TENANT_MIGRATIONS_DISPATCH_SKIPPED,
      failed: RELEASE_LOG.TENANT_MIGRATIONS_DISPATCH_FAILED,
      error: RELEASE_LOG.TENANT_MIGRATIONS_DISPATCH_ERROR,
    },
    logContext: { environment, tenantId },
  });
