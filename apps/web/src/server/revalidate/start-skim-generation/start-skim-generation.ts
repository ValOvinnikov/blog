import { SANITY_WEBHOOK_OPERATION } from '@shinefold/config/constants';
import type { TMaybeUndefined } from '@shinefold/config/types';
import { service, type TTenantSanityContext } from '@shinefold/service';
import { GENERATE_SKIM_LOG } from '@web/constants/generate-skim';
import { STARTER_DOCUMENT_ID_PREFIX } from '@web/constants/revalidate';
import { POST_TYPE } from '@web/server/revalidate/derive-revalidate-paths/derive-revalidate-paths';
import { enqueueWorkerRun } from '@web/server/revalidate/enqueue-worker-run/enqueue-worker-run';
import type { TPostWebhookEvent } from '@web/server/revalidate/post-webhook-event/post-webhook-event';
import { generatePostSkim } from '@web/server/skim/generate-post-skim/generate-post-skim';
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

const SKIM_GO_LIVE_PATH = '/api/scheduled-post-skim';

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
  if (!tenant) return;

  await generatePostSkim({
    postId,
    apiKey,
    readTenant,
    writeContext: toTenantSanityWriteContext(tenant),
  });
};

// Only `create` is a first publish: the editor's approval publish arrives as `update` and must not spend the allowance again.
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
