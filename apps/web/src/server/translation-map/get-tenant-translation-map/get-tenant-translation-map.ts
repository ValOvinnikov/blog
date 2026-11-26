import type { TMaybeUndefined } from '@shinefold/config';
import { queries } from '@shinefold/db';
import type { TTenant } from '@shinefold/db/schema/tenants';
import { service, type TTranslationMap } from '@shinefold/service';
import { TRANSLATION_MAP_LOG } from '@web/constants/translation-map';
import { logger } from '@web/utils/logger/logger';

export const getTenantTranslationMap = async (
  tenant: TTenant,
): Promise<TMaybeUndefined<TTranslationMap>> => {
  try {
    const sanityContext = queries.tenants.toTenantSanityCredentials(tenant);
    if (!sanityContext) {
      return undefined;
    }

    const result =
      await service.global.translationMap.v1.getTranslationMap(sanityContext);
    if (!result.ok) {
      logger.error(TRANSLATION_MAP_LOG.FETCH_FAILED, { error: result.error });
      return undefined;
    }
    return result.data;
  } catch (error) {
    logger.error(TRANSLATION_MAP_LOG.FETCH_FAILED, { error });
    return undefined;
  }
};
