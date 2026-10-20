import type {
  Page_home,
  Page_postIndex,
  Settings_footer,
  Settings_navigation,
  Settings_site,
  Template_home,
  Template_postIndex,
} from '@blog/config/sanity/generated/types';

type TSanitySystemField = '_createdAt' | '_updatedAt' | '_rev';

export type TStarterDocument<
  TDocument extends { _id: string; _type: string },
  TRequiredField extends keyof TDocument,
> = Omit<TDocument, TSanitySystemField> &
  Required<Pick<TDocument, TRequiredField>>;

export type TStarterPage<TPage extends Page_home | Page_postIndex> =
  TStarterDocument<TPage, 'title' | 'headingBlock' | 'template' | 'seo'>;

export type TStarterDocumentUnion =
  | TStarterDocument<Settings_navigation, 'title'>
  | TStarterDocument<Settings_footer, 'title'>
  | TStarterDocument<Settings_site, 'title'>
  | TStarterDocument<Template_home, 'title'>
  | TStarterPage<Page_home>
  | TStarterDocument<Template_postIndex, 'title'>
  | TStarterPage<Page_postIndex>;

export function seo(metaTitle: string, metaDescription: string) {
  return {
    _type: 'seo',
    metaTitle,
    metaDescription,
    openGraph: {
      _type: 'openGraph',
      ogTitle: metaTitle,
      ogDescription: metaDescription,
    },
  } as const;
}

export function reference(id: string) {
  return { _type: 'reference', _ref: id } as const;
}
