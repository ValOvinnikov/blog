import {
  SANITY_WEBHOOK_OPERATION,
  STARTER_DOCUMENT_ID_PREFIX,
} from '@shinefold/config/constants';
import type { TMaybeUndefined } from '@shinefold/config/types';
import { service, type TTenantSanityContext } from '@shinefold/service';
import {
  GENERATE_SKIM_LOG,
  SKIM_GO_LIVE_PATH,
} from '@web/constants/generate-skim';
import { POST_TYPE } from '@web/server/revalidate/derive-revalidate-paths/derive-revalidate-paths';
import { enqueueWorkerRun } from '@web/server/revalidate/enqueue-worker-run/enqueue-worker-run';
import type { TPostWebhookEvent } from '@web/server/revalidate/post-webhook-event/post-webhook-event';
import { generatePostSkim } from '@web/server/skim/generate-post-skim/generate-post-skim';
import { hasExistingTakeaways } from '@web/server/skim/has-existing-takeaways/has-existing-takeaways';
import { resolveTenantById } from '@web/server/tenant/resolve-tenant/resolve-tenant';
import { toTenantSanityWriteContext } from '@web/server/tenant/tenant-sanity-context/tenant-sanity-context';
import { env } from '@web/utils/env/env';
import { logger } from '@web/utils/logger/logger';
import { after } from 'next/server';

export type TStartSkimGenerationInput = TPostWebhookEvent & {
  tenant: TMaybeUndefined<TTenantSanityContext>;
};

type TFirstPublish = {
  postId: string;
  tenantId: string;
  readTenant: TTenantSanityContext;
  apiKey: string;
};

const readPublishedAt = async (
  postId: string,
  tenantId: string,
  readTenant: TTenantSanityContext,
): Promise<TMaybeUndefined<string>> => {
  const result = await service.entities.posts.v1.getPostPublishedAt(
    postId,
    readTenant,
  );
  if (result.ok) return result.data;

  logger.error(GENERATE_SKIM_LOG.PUBLISHED_AT_LOOKUP_FAILED, {
    tenantId,
    postId,
    error: result.error,
  });
  return undefined;
};

const generateFirstPublishSkim = async ({
  postId,
  tenantId,
  readTenant,
  apiKey,
}: TFirstPublish): Promise<void> => {
  const publishedAt = await readPublishedAt(postId, tenantId, readTenant);
  if (!publishedAt) return;

  if (Date.parse(publishedAt) > Date.now()) {
    await enqueueWorkerRun({
      path: SKIM_GO_LIVE_PATH,
      request: { tenantId, postId, publishedAt },
      log: {
        SKIPPED: GENERATE_SKIM_LOG.GO_LIVE_ENQUEUE_SKIPPED,
        REFUSED: GENERATE_SKIM_LOG.GO_LIVE_ENQUEUE_REFUSED,
        FAILED: GENERATE_SKIM_LOG.GO_LIVE_ENQUEUE_FAILED,
      },
    });
    return;
  }

  const tenant = await resolveTenantById(tenantId);
  if (!tenant) {
    logger.warn(GENERATE_SKIM_LOG.TENANT_NOT_SERVABLE, { tenantId, postId });
    return;
  }
  const writeContext = toTenantSanityWriteContext(tenant);

  const existing = await hasExistingTakeaways(postId, writeContext);
  if (!existing.ok || existing.data) return;

  await generatePostSkim({ postId, apiKey, readTenant, writeContext });
};

// The approval publish arrives as `update`; a republish or redelivered `create` finds the existing summary and spends nothing.
export const startSkimGeneration = ({
  operation,
  type,
  id: postId,
  tenantId,
  tenant: readTenant,
}: TStartSkimGenerationInput): void => {
  const { ANTHROPIC_API_KEY: apiKey } = env;
  if (
    operation !== SANITY_WEBHOOK_OPERATION.CREATE ||
    type !== POST_TYPE ||
    postId.startsWith(STARTER_DOCUMENT_ID_PREFIX) ||
    !tenantId ||
    !readTenant ||
    !apiKey
  ) {
    return;
  }

  after(() =>
    generateFirstPublishSkim({ postId, tenantId, readTenant, apiKey }).catch(
      (error: unknown) => {
        logger.error(GENERATE_SKIM_LOG.PUBLISH_START_FAILED, {
          tenantId,
          postId,
          error,
        });
      },
    ),
  );
};
