import type { TBrandVariant, TLayout, TMaybeUndefined } from '@blog/config';
import type { TPortableTextBody } from '@blog/service/shared/transformers/portable-text/to-portable-text-body';

export type TContentModule = {
  brandVariant: TBrandVariant;
  body: TPortableTextBody;
  layout: TMaybeUndefined<TLayout>;
};
