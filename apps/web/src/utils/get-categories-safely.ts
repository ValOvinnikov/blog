import { service, type TCategoriesList } from '@blog/service';

/**
 * Fetches every category for the category chip row, falling back to an
 * empty list on failure. `service.entities.categories.v1.getCategories`
 * isn't `AsyncResult`-wrapped, so a Sanity error would otherwise throw and
 * take down the whole archive page — this is decorative navigation, not
 * critical page content, so a failure here must never 404 `/blog` or
 * `/category/[slug]`.
 */
export async function getCategoriesSafely(): Promise<TCategoriesList> {
  try {
    return await service.entities.categories.v1.getCategories();
  } catch (error) {
    console.error('Failed to load categories:', error);
    return [];
  }
}
