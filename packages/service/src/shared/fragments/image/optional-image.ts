import type { ImageWithAlt } from '@blog/config';
import type { TSchemaConfig } from '@blog/service/sanity/query/query';
import type {
  Fragment,
  GroqBuilder,
  GroqBuilderSubquery,
  InferFragmentType,
  QueryConfig,
} from 'groqd';

type TFieldPath<TScope, TConfig extends QueryConfig> = Parameters<
  GroqBuilderSubquery<TScope, TConfig>['field']
>[0];

type TImageFragment = Fragment<unknown, QueryConfig, unknown>;

// Studio leaves `{ _type, alt }` behind when an image is removed, so an image without an asset projects as null, the same as an absent one.
export function optionalImage<
  TScope,
  TConfig extends QueryConfig,
  TFragment extends TImageFragment,
>(
  sub: GroqBuilderSubquery<TScope, TConfig>,
  field: TFieldPath<TScope, TConfig>,
  fragment: TFragment,
): GroqBuilder<InferFragmentType<TFragment> | null, TConfig>;
// Loose because groqd cannot type a projection over a generic field path; the groq-js tests prove the result.
export function optionalImage(
  sub: GroqBuilderSubquery<Record<string, ImageWithAlt>, TSchemaConfig>,
  field: string,
  fragment: TImageFragment,
): unknown {
  return sub.select({
    [`defined(${field}.asset)`]: sub.field(field).project(fragment),
  });
}
