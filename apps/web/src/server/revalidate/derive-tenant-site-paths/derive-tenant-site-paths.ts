import type { TTenantSanityContext } from '@blog/service';
import { errorResult, okResult, type TResult } from '@blog/utils';
import { FETCH_FAILED_REASON, REVALIDATE_LOG } from '@web/constants/revalidate';
import { resolveTenantLiveLocales } from '@web/server/tenant/tenant-live-locales/tenant-live-locales';
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
  documentHref?: string;
};

type TPageListFailure = { list: string; error: unknown };

const isFailedEntry = (
  entry: [string, TResult<unknown>],
): entry is [string, { ok: false; error: unknown }] => !entry[1].ok;

const toPageLists = (
  results: TTenantPageListResults,
): TResult<TTenantPageLists, TPageListFailure> => {
  const { posts, topics, tags, topicPages, tagPages, blogPages } = results;
  const { landingPages, privacyDocuments, legalDocuments } = results;
  if (
    posts.ok &&
    topics.ok &&
    tags.ok &&
    topicPages.ok &&
    tagPages.ok &&
    blogPages.ok &&
    landingPages.ok &&
    privacyDocuments.ok &&
    legalDocuments.ok
  ) {
    return okResult({
      posts: posts.data,
      topics: topics.data,
      tags: tags.data,
      topicPages: topicPages.data,
      tagPages: tagPages.data,
      blogPages: blogPages.data,
      landingPages: landingPages.data,
      privacyDocuments: privacyDocuments.data,
      legalDocuments: legalDocuments.data,
    });
  }
  const [list = '', failed] = Object.entries(results).find(isFailedEntry) ?? [];
  return errorResult({ list, error: failed?.error });
};

export const deriveTenantSitePaths = async ({
  tenantId,
  tenant,
  documentHref,
}: TDeriveTenantSitePathsInput): Promise<
  TResult<string[], typeof FETCH_FAILED_REASON>
> => {
  const locales = await resolveTenantLiveLocales(tenantId);
  if (!locales.ok) {
    logger.error(REVALIDATE_LOG.LIVE_LOCALES_LOOKUP_FAILED, {
      tenantId,
      error: locales.error,
    });
    return errorResult(FETCH_FAILED_REASON);
  }
  const lists = toPageLists(
    await getTenantPageListResults(tenant, locales.data),
  );
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
      locales: locales.data,
      lists: lists.data,
      documentHref,
    }),
  );
};
