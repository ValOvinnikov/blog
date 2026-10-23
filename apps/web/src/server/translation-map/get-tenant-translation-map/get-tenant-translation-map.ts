import type { TMaybeUndefined } from '@blog/config';
import { queries } from '@blog/db';
import type { TTenant } from '@blog/db/schema/tenants';
import { service, type TTranslationMap } from '@blog/service';
import { TRANSLATION_MAP_FETCH_FAILED_EVENT } from '@web/constants/translation-map';
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
      logger.error(TRANSLATION_MAP_FETCH_FAILED_EVENT, { error: result.error });
      return undefined;
    }
    return result.data;
  } catch (error) {
    logger.error(TRANSLATION_MAP_FETCH_FAILED_EVENT, { error });
    return undefined;
  }
};
