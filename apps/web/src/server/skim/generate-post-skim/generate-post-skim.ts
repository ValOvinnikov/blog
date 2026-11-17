import { HTTP_STATUS } from '@shinefold/config';
import {
  getPlatformSanityWriteContext,
  service,
  type TTenantSanityContext,
} from '@shinefold/service';
import { GENERATE_SKIM_LOG } from '@web/constants/generate-skim';
import {
  generateTakeaways,
  SKIM_GENERATION_MODEL,
} from '@web/server/skim/generate-takeaways/generate-takeaways';
import {
  gateSkimWrite,
  releaseSkimGeneration,
  type TSkimRefusal,
} from '@web/server/skim/skim-write-gate/skim-write-gate';
import type { TTenantSanityWriteContext } from '@web/server/tenant/tenant-sanity-context/tenant-sanity-context';
import { logger } from '@web/utils/logger/logger';

export type TGeneratePostSkimInput = {
  postId: string;
  apiKey: string;
  readTenant: TTenantSanityContext;
  writeContext: TTenantSanityWriteContext;
};

export type TGeneratePostSkimResult =
  | { isGenerated: true; count: number }
  | ({ isGenerated: false } & TSkimRefusal);

const SAVE_FAILED_MESSAGE = 'Failed to save the skim draft.';

const refuse = (message: string, status: number): TGeneratePostSkimResult => ({
  isGenerated: false,
  message,
  status,
});

export const generatePostSkim = async ({
  postId,
  apiKey,
  readTenant,
  writeContext,
}: TGeneratePostSkimInput): Promise<TGeneratePostSkimResult> => {
  const gate = await gateSkimWrite(postId, writeContext);
  if (!gate.isAllowed) {
    return { isGenerated: false, ...gate.refusal };
  }
  const { tenant: writeTenant, claim } = gate;

  const bodyResult = await service.editorial.skim.v1.getPublishedPostBody(
    postId,
    readTenant,
  );
  if (!bodyResult.ok) {
    logger.error(GENERATE_SKIM_LOG.POST_BODY_FETCH_FAILED, {
      postId,
      error: bodyResult.error,
    });
    await releaseSkimGeneration(claim, postId);
    return refuse(
      'Failed to read the published post.',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
    );
  }

  let takeaways: string[];
  try {
    takeaways = await generateTakeaways(bodyResult.data, apiKey);
  } catch (error) {
    logger.error(GENERATE_SKIM_LOG.GENERATION_FAILED, { postId, error });
    await releaseSkimGeneration(claim, postId);
    return refuse(
      'Failed to generate takeaways.',
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
    );
  }

  let resolvedWriteTenant: TTenantSanityContext;
  try {
    resolvedWriteTenant = writeTenant ?? getPlatformSanityWriteContext();
  } catch (error) {
    logger.error(GENERATE_SKIM_LOG.WRITE_CLIENT_UNCONFIGURED, {
      postId,
      error,
    });
    return refuse(SAVE_FAILED_MESSAGE, HTTP_STATUS.SERVICE_UNAVAILABLE);
  }

  const saveResult = await service.editorial.skim.v1.saveSkimDraft(
    { postId, takeaways, model: SKIM_GENERATION_MODEL },
    resolvedWriteTenant,
  );
  if (!saveResult.ok) {
    logger.error(GENERATE_SKIM_LOG.DRAFT_SAVE_FAILED, {
      postId,
      error: saveResult.error,
    });
    return refuse(SAVE_FAILED_MESSAGE, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }

  return { isGenerated: true, count: takeaways.length };
};
