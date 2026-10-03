import { q } from '@blog/service/sanity/query';
import type {
  Fragment,
  GroqBuilderSubquery,
  InferFragmentType,
  QueryConfig,
} from 'groqd';

export type TLocalizedEntry<TValue> = {
  language: string | null;
  value: TValue | null;
};

const STAR_PREFIX = /^\*\s*/;

export function localizedEntries<TResult, TQueryConfig extends QueryConfig>(
  sub: GroqBuilderSubquery<TResult, TQueryConfig>,
  field: string,
) {
  return sub.raw<Array<TLocalizedEntry<string>> | null>(
    `${field}[]{ language, value }`,
  );
}

export function localizedProjectedEntries<
  TResult,
  TQueryConfig extends QueryConfig,
  TFragment extends Fragment<unknown, QueryConfig, unknown>,
>(
  sub: GroqBuilderSubquery<TResult, TQueryConfig>,
  field: string,
  fragment: TFragment,
) {
  const projection = q.star.project(fragment as never).query;

  return sub.raw<Array<
    TLocalizedEntry<Array<InferFragmentType<TFragment>>>
  > | null>(
    `${field}[]{ language, "value": value[]${projection.replace(STAR_PREFIX, '')} }`,
  );
}
