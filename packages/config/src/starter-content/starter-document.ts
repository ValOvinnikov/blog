import type {
  Blog_topic,
  Link,
  Module_cta,
  Module_heroBlog,
  Module_postLatest,
  Module_postList,
  Module_taxonomyList,
  Page_home,
  Page_landing,
  Page_post,
  Page_postIndex,
  Page_tagIndex,
  Page_topic,
  Page_topicIndex,
  Person,
  Settings_footer,
  Settings_navigation,
  Settings_site,
  Template_home,
  Template_landing,
  Template_postIndex,
  Template_tagIndex,
  Template_topic,
  Template_topicIndex,
} from '@blog/config/sanity/generated/types';

type TSanitySystemField = '_createdAt' | '_updatedAt' | '_rev';

export type TStarterDocument<
  TDocument extends { _id: string; _type: string },
  TRequiredField extends keyof TDocument,
> = Omit<TDocument, TSanitySystemField> &
  Required<Pick<TDocument, TRequiredField>>;

export type TStarterPage<
  TPage extends
    | Page_home
    | Page_postIndex
    | Page_landing
    | Page_topicIndex
    | Page_tagIndex
    | Page_topic,
> = TStarterDocument<TPage, 'title' | 'headingBlock' | 'template' | 'seo'>;

export type TStarterModule<
  TModule extends
    | Module_heroBlog
    | Module_postLatest
    | Module_postList
    | Module_taxonomyList
    | Module_cta,
> = TStarterDocument<TModule, 'title' | 'brandVariant'>;

export type TStarterPost = TStarterDocument<
  Page_post,
  'title' | 'slug' | 'headingBlock' | 'author' | 'publishedAt' | 'seo'
>;

export type TStarterDocumentUnion =
  | TStarterDocument<Settings_navigation, 'title'>
  | TStarterDocument<Settings_footer, 'title'>
  | TStarterDocument<Settings_site, 'title'>
  | TStarterDocument<Template_home, 'title'>
  | TStarterPage<Page_home>
  | TStarterDocument<Template_postIndex, 'title'>
  | TStarterPage<Page_postIndex>
  | TStarterDocument<Template_landing, 'title'>
  | TStarterPage<Page_landing>
  | TStarterDocument<Template_topicIndex, 'title'>
  | TStarterPage<Page_topicIndex>
  | TStarterDocument<Template_tagIndex, 'title'>
  | TStarterPage<Page_tagIndex>
  | TStarterDocument<Template_topic, 'title'>
  | TStarterPage<Page_topic>
  | TStarterDocument<Person, 'name'>
  | TStarterPost
  | TStarterDocument<Blog_topic, 'title'>
  | TStarterDocument<Link, 'title' | 'label' | 'linkType'>
  | TStarterModule<Module_heroBlog>
  | TStarterModule<Module_postLatest>
  | TStarterModule<Module_postList>
  | TStarterModule<Module_taxonomyList>
  | TStarterModule<Module_cta>;
