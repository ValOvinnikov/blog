import { queries } from '@blog/db';
import type { TTenantSanityContext } from '@blog/service';
import { errorResult, okResult, type TResult } from '@blog/utils';
import { FETCH_FAILED_REASON, REVALIDATE_LOG } from '@web/constants/revalidate';
import { routing } from '@web/i18n/routing';
import {
  getTenantPageListResults,
  type TTenantPageListResults,
  type TTenantPageLists,
} from '@web/server/tenant/tenant-page-lists/tenant-page-lists';
import { buildTenantSitePaths } from '@web/utils/build-tenant-site-paths';
import { logger } from '@web/utils/logger/logger';

export type TDeriveTenantSitePathsInput = {
  tenantId: string;
  tenant: TTenantSanityContext;
  removedPostSlug?: string;
};

const toPageLists = (
  results: TTenantPageListResults,
): TResult<TTenantPageLists, { list: string; error: unknown }> => {
  const lists: Partial<Record<string, unknown>> = {};
  for (const [list, result] of Object.entries(results)) {
    if (!result.ok) {
      return errorResult({ list, error: result.error });
    }
    lists[list] = result.data;
  }
  return okResult(lists as TTenantPageLists);
};

export const deriveTenantSitePaths = async ({
  tenantId,
  tenant,
  removedPostSlug,
}: TDeriveTenantSitePathsInput): Promise<
  TResult<string[], typeof FETCH_FAILED_REASON>
> => {
  const locales = (await queries.tenants.getTenantLiveLocales(tenantId)) ?? [
    routing.defaultLocale,
  ];
  const lists = toPageLists(await getTenantPageListResults(tenant, locales));
  if (!lists.ok) {
    logger.error(REVALIDATE_LOG.TENANT_PAGE_LIST_LOOKUP_FAILED, {
      tenantId,
      ...lists.error,
    });
    return errorResult(FETCH_FAILED_REASON);
  }
  return okResult(
    buildTenantSitePaths({
      tenantId,
      locales,
      lists: lists.data,
      removedPostSlug,
    }),
  );
};
