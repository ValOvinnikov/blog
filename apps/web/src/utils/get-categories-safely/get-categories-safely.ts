import { createLogger } from '@blog/insight';
import { service, type TCategoriesList } from '@blog/service';

const logger = createLogger();

/**
 * Fetches every category for the category chip row, falling back to an
 * empty list on failure — this is decorative navigation, not critical page
 * content, so a failure here must never 404 `/blog` or `/category/[slug]`.
 */
export async function getCategoriesSafely(): Promise<TCategoriesList> {
  const result = await service.entities.categories.v1.getCategories();

  if (!result.ok) {
    logger.error('categories.fetch_failed', { error: result.error });
    return [];
  }

  return result.data;
}
