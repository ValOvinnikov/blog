import { getTranslationMap } from '@blog/service/features/global/translation-map/adaptor/loader';
import { findTranslationGroup } from '@blog/service/features/global/translation-map/adaptor/transformer';
import type { TTenantSanityContext } from '@blog/service/sanity/query/query';
import { safeAsync } from '@blog/utils';

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
