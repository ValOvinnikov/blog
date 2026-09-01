import {
  service,
  type TTenantSanityContext,
  type TTopicsList,
} from '@blog/service';
import { logger } from '@web/utils/logger/logger';

/**
 * Fetches every topic for the topic chip row, falling back to an
 * empty list on failure — this is decorative navigation, not critical page
 * content, so a failure here must never 404 `/blog` or `/topics/[slug]`.
 */
export const getTopicsSafely = async (
  tenant?: TTenantSanityContext,
): Promise<TTopicsList> => {
  const result = await service.entities.topics.v1.getTopics(tenant);

  if (!result.ok) {
    logger.error('topics.fetch_failed', { error: result.error });
    return [];
  }

  return result.data;
};
