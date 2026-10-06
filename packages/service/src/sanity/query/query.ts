import type {
  AllSanitySchemaTypes,
  internalGroqTypeReferenceTo,
} from '@blog/config';
import {
  getClient,
  type TTenantSanityContext,
} from '@blog/service/sanity/client/client';
import {
  buildLocaleParams,
  type TLocaleParams,
} from '@blog/service/shared/localization/locale-params/locale-params';
import { createGroqBuilder, type IGroqBuilder, type QueryConfig } from 'groqd';

export type { TTenantSanityContext };

export type TSchemaConfig = {
  schemaTypes: AllSanitySchemaTypes;
  referenceSymbol: typeof internalGroqTypeReferenceTo;
};

export const q = createGroqBuilder<TSchemaConfig>();

export type TSlugParams = { slug: string };

export type TModuleQueryParams = { id: string } & TLocaleParams;

type TNextFetchOptions = {
  next?: { revalidate?: number | false; tags?: string[] };
  tenant: TTenantSanityContext;
};

type TCallerParameters<TParameters> = Omit<TParameters, keyof TLocaleParams>;

type TParametersOption<TParameters> = unknown extends TParameters
  ? { parameters?: Record<string, never> }
  : Record<never, never> extends TCallerParameters<TParameters>
    ? { parameters?: TCallerParameters<TParameters> }
    : { parameters: TCallerParameters<TParameters> };

export async function runQuery<TResult, TQueryConfig extends QueryConfig>(
  builder: IGroqBuilder<TResult, TQueryConfig>,
  options: TNextFetchOptions & TParametersOption<TQueryConfig['parameters']>,
): Promise<TResult> {
  const { parameters, next, tenant } = options;
  const raw: unknown = await getClient(tenant).fetch(
    builder.query,
    { ...buildLocaleParams(tenant), ...parameters },
    next ? { next } : undefined,
  );
  return builder.parse(raw);
}
