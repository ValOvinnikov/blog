import { queries } from '@blog/db';
import type { TTenant } from '@blog/db/schema/tenants';
import { service, type TTranslationMap } from '@blog/service';
import { logger } from '@web/utils/logger/logger';

/** Served from the Data Cache under the map's ISR tags, so a request rarely reaches Sanity. */
export const getTenantTranslationMap = async (
  tenant: TTenant,
): Promise<TTranslationMap | undefined> => {
  try {
    const sanityContext = queries.tenants.toTenantSanityCredentials(tenant);
    if (!sanityContext) {
      return undefined;
    }

    const result =
      await service.global.translationMap.v1.getTranslationMap(sanityContext);
    if (!result.ok) {
      logger.error('translation_map.fetch_failed', { error: result.error });
      return undefined;
    }
    return result.data;
  } catch (error) {
    logger.error('translation_map.fetch_failed', { error });
    return undefined;
  }
};
