import type {
  AllSanitySchemaTypes,
  internalGroqTypeReferenceTo,
} from '@blog/config';
import { SANITY_PERSPECTIVE } from '@blog/config/constants';
import {
  getClient,
  type TTenantSanityContext,
} from '@blog/service/sanity/client/client';
import {
  buildLocaleQueryParams,
  type TLocaleQueryParams,
} from '@blog/service/shared/localization/locale-query-params/locale-query-params';
import { createGroqBuilder, type IGroqBuilder, type QueryConfig } from 'groqd';

export type { TTenantSanityContext };

export type TSchemaConfig = {
  schemaTypes: AllSanitySchemaTypes;
  referenceSymbol: typeof internalGroqTypeReferenceTo;
};

export const q = createGroqBuilder<TSchemaConfig>();

export type TSlugQueryParams = { slug: string };

export type TModuleQueryParams = { id: string } & TLocaleQueryParams;

type TFetchCacheOptions = {
  next?: { revalidate?: number | false; tags?: string[] };
  cache?: 'no-store';
};

type TNextFetchOptions = TFetchCacheOptions & {
  tenant: TTenantSanityContext;
};

type TCallerParameters<TParameters> = Omit<
  TParameters,
  keyof TLocaleQueryParams
>;

type TParametersOption<TParameters> = unknown extends TParameters
  ? { parameters?: Record<string, never> }
  : Record<never, never> extends TCallerParameters<TParameters>
    ? { parameters?: TCallerParameters<TParameters> }
    : { parameters: TCallerParameters<TParameters> };

// A draft read must never land in the shared Data Cache, where a published visitor could be served it.
function toFetchOptions(
  { perspective }: TTenantSanityContext,
  { next, cache }: TFetchCacheOptions,
) {
  if (perspective === SANITY_PERSPECTIVE.DRAFTS) {
    return { perspective, cache: 'no-store' as const };
  }
  return cache ? { cache } : next ? { next } : undefined;
}

export async function runQuery<TResult, TQueryConfig extends QueryConfig>(
  builder: IGroqBuilder<TResult, TQueryConfig>,
  options: TNextFetchOptions & TParametersOption<TQueryConfig['parameters']>,
): Promise<TResult> {
  const { parameters, next, cache, tenant } = options;
  const raw: unknown = await getClient(tenant).fetch(
    builder.query,
    { ...buildLocaleQueryParams(tenant), ...parameters },
    toFetchOptions(tenant, { next, cache }),
  );
  return builder.parse(raw);
}
