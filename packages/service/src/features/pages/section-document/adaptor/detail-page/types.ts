import type {
  THeadingAlignment,
  THeadingBlock,
  TLegalPageKind,
  TMaybeUndefined,
} from '@shinefold/config';
import type { TPageTranslation } from '@shinefold/service/shared/localization/page-translations/to-page-translations';
import type { TPortableTextBody } from '@shinefold/service/shared/transformers/portable-text/to-portable-text-body';
import type { TSeoResolved } from '@shinefold/service/shared/transformers/seo/resolve-seo';
import type { TSectionDocumentType } from '@shinefold/service/shared/types/page/section-document-type';

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
