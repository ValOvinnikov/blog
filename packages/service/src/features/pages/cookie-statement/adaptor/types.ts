import type {
  THeadingAlignment,
  THeadingBlock,
  TMaybeUndefined,
} from '@shinefold/config';
import type { TLocaleIsoCode } from '@shinefold/config/constants';
import type { TPortableTextBody } from '@shinefold/service/shared/transformers/portable-text/to-portable-text-body';
import type { TSeoResolved } from '@shinefold/service/shared/transformers/seo/resolve-seo';

export type TCookieStatementPage = {
  id: string;
  title: string;
  headingBlock: TMaybeUndefined<THeadingBlock>;
  headingAlignment: THeadingAlignment;
  body: TPortableTextBody;
  seo: TSeoResolved;
  translations: TLocaleIsoCode[];
};
