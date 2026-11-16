import type {
  TBrandVariant,
  TLayout,
  TMaybeUndefined,
} from '@shinefold/config';
import type { TPortableTextBody } from '@shinefold/service/shared/transformers/portable-text/to-portable-text-body';

export type TContentModule = {
  brandVariant: TBrandVariant;
  body: TPortableTextBody;
  layout: TMaybeUndefined<TLayout>;
};
