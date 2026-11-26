import {
  service,
  type TTenantSanityContext,
  type TTopicsList,
} from '@shinefold/service';
import { TOPIC_LOG } from '@web/constants/topic';
import { logger } from '@web/utils/logger/logger';

/** Decorative navigation: a failure must never 404 the page. */ export const getTopicsSafely =
  async (tenant: TTenantSanityContext): Promise<TTopicsList> => {
    const result = await service.entities.topics.v1.getTopics(tenant);

    if (!result.ok) {
      logger.error(TOPIC_LOG.LIST_FETCH_FAILED, { error: result.error });
      return [];
    }

    return result.data;
  };
