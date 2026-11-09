import type { THeadingBlock, TMaybeUndefined } from '@blog/config';
import type { TLocaleIsoCode } from '@blog/config/constants';
import type { THeadingAlignment } from '@blog/service/shared/transformers/heading-block/to-heading-alignment';
import type { TPortableTextBody } from '@blog/service/shared/transformers/portable-text/to-portable-text-body';
import type { TSeoResolved } from '@blog/service/shared/transformers/seo/resolve-seo';

export type TCookieStatementPage = {
  id: string;
  title: string;
  headingBlock: TMaybeUndefined<THeadingBlock>;
  headingAlignment: THeadingAlignment;
  body: TPortableTextBody;
  seo: TSeoResolved;
  translations: TLocaleIsoCode[];
};
