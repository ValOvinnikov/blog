import type { TMaybeUndefined } from '@blog/config';
import { getSiteSettings } from '@blog/service/features/global/site-settings/adaptor/loader';
import type { TSiteSettings } from '@blog/service/features/global/site-settings/adaptor/types';
import {
  isr,
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query';
import type { IGroqBuilder, QueryConfig } from 'groqd';

type TRawTaxonomyIndexPage = {
  taxonomyList: { _id: string } | null;
};

type TCreateTaxonomyIndexPageLoaderOptions<
  TRaw extends TRawTaxonomyIndexPage,
  TPage,
  TQueryConfig extends QueryConfig,
> = {
  query: IGroqBuilder<TRaw | null, TQueryConfig>;
  transformer: (
    rawPage: TRaw,
    settings: TSiteSettings,
    taxonomyListId: string,
  ) => TPage;
  tags: string[];
  MissingTaxonomyListError: new () => Error;
};

/**
 * Builds the shared `getIndexPage` loader for the taxonomy index pages
 * (tag-index, topic-index). `tags` must cover both the page's own document
 * type and `taxonomyList`'s, since the query derefs it.
 */
export function createTaxonomyIndexPageLoader<
  TRaw extends TRawTaxonomyIndexPage,
  TPage,
  TQueryConfig extends QueryConfig,
>({
  query,
  transformer,
  tags,
  MissingTaxonomyListError,
}: TCreateTaxonomyIndexPageLoaderOptions<TRaw, TPage, TQueryConfig>) {
  return async function getIndexPage(
    tenant: TTenantSanityContext,
  ): Promise<TMaybeUndefined<TPage>> {
    // `parameters: {}` is a no-op at runtime (`runQuery` defaults it the
    // same way) — needed only because a generic `TQueryConfig` can't narrow
    // away `runQuery`'s optional-parameters overload the way a concrete
    // query type does.
    const rawPage = await runQuery(query, {
      parameters: {},
      tenant,
      ...isr(tags, tenant.projectId),
    });
    if (!rawPage) return undefined;
    if (!rawPage.taxonomyList) {
      throw new MissingTaxonomyListError();
    }

    const settings = await getSiteSettings(tenant);
    return transformer(rawPage, settings, rawPage.taxonomyList._id);
  };
}
