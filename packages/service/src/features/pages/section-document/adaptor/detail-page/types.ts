import type {
  THeadingAlignment,
  THeadingBlock,
  TLegalPageKind,
  TMaybeUndefined,
} from '@blog/config';
import type { TPageTranslation } from '@blog/service/shared/localization/page-translations/to-page-translations';
import type { TPortableTextBody } from '@blog/service/shared/transformers/portable-text/to-portable-text-body';
import type { TSeoResolved } from '@blog/service/shared/transformers/seo/resolve-seo';
import type { TSectionDocumentType } from '@blog/service/shared/types/page/section-document-type';

export type TSectionDocumentDetail = {
  id: string;
  type: TSectionDocumentType;
  title: string;
  slug: string;
  kind: TLegalPageKind;
  headingBlock: TMaybeUndefined<THeadingBlock>;
  headingAlignment: THeadingAlignment;
  body: TPortableTextBody;
  seo: TSeoResolved;
  translations: TPageTranslation[];
};
