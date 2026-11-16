import { getTranslationMap } from '@shinefold/service/features/global/translation-map/adaptor/loader';
import { findTranslationGroup } from '@shinefold/service/features/global/translation-map/adaptor/transformer';
import type { TTenantSanityContext } from '@shinefold/service/sanity/query/query';
import { safeAsync } from '@shinefold/utils';

export function createTranslationMapService() {
  return {
    v1: {
      getTranslationMap: safeAsync((tenant: TTenantSanityContext) =>
        getTranslationMap(tenant),
      ),
      findTranslationGroup,
    },
  };
}
