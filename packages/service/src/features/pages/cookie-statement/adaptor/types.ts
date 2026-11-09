import type { TLocaleIsoCode } from '@blog/config/constants';
import type { TPortableTextBody } from '@blog/service/shared/transformers/portable-text/to-portable-text-body';
import type { TSeoResolved } from '@blog/service/shared/transformers/seo/resolve-seo';

export type TCookieStatementPage = {
  id: string;
  title: string;
  body: TPortableTextBody;
  seo: TSeoResolved;
  translations: TLocaleIsoCode[];
};
