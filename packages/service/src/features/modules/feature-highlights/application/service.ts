import { getFeatureHighlightsModule } from '@blog/service/features/modules/feature-highlights/adaptor/loader';
import type { TTenantSanityContext } from '@blog/service/sanity/query';
import { safeAsync } from '@blog/utils';

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
