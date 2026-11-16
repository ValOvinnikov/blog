import { getFeatureHighlightsModule } from '@shinefold/service/features/modules/feature-highlights/adaptor/loader';
import type { TTenantSanityContext } from '@shinefold/service/sanity/query/query';
import { safeAsync } from '@shinefold/utils';

export function createFeatureHighlightsModuleService() {
  return {
    v1: {
      getFeatureHighlightsModule: safeAsync(
        (id: string, tenant: TTenantSanityContext) =>
          getFeatureHighlightsModule(id, tenant),
      ),
    },
  };
}
