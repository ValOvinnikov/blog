import { pathToFileURL } from 'node:url';

import { listTenants } from '@blog/db/queries/tenants';
import type { TTenant } from '@blog/db/schema/tenants';
import { sanitizeLogMessage } from '@blog/insight';
import { createTenantRevalidateWebhook } from '@worker/steps/create-revalidate-webhook';
import { logger } from '@worker/utils/logger/logger';
import { getProvisionEnv } from '@worker/utils/provision-env/provision-env';

type TWebhookSecretRotationSummary = {
  rotated: string[];
  failed: string[];
};

function isDueForRotation(tenant: TTenant): boolean {
  return Boolean(
    tenant.sanityProjectId &&
    tenant.webhookCreatedAt &&
    !tenant.revalidateWebhookSecretEncrypted,
  );
}

export async function rotateRevalidateWebhookSecrets(): Promise<TWebhookSecretRotationSummary> {
  const env = getProvisionEnv();
  const due = (await listTenants()).filter(isDueForRotation);
  const summary: TWebhookSecretRotationSummary = { rotated: [], failed: [] };

  for (const tenant of due) {
    try {
      await createTenantRevalidateWebhook(tenant, env);
      summary.rotated.push(tenant.id);
    } catch (error) {
      logger.error('webhook_secret_rotation.tenant_failed', {
        tenantId: tenant.id,
        error: sanitizeLogMessage(error),
      });
      summary.failed.push(tenant.id);
    }
  }

  return summary;
}

async function main(): Promise<void> {
  try {
    const summary = await rotateRevalidateWebhookSecrets();
    logger.info('webhook_secret_rotation.finished', summary);
    if (summary.failed.length > 0) process.exitCode = 1;
  } catch (error) {
    logger.error('webhook_secret_rotation.failed', {
      error: sanitizeLogMessage(error),
    });
    process.exitCode = 1;
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  void main();
}
