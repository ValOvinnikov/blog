import type {
  Block_faq,
  Blog_topic,
  Link,
  Module_cta,
  Module_content,
  Module_faq,
  Module_heroBlog,
  Module_heroProfile,
  Module_heroStatement,
  Module_postLatest,
  Module_postList,
  Module_sectionPages,
  Module_taxonomyList,
  Page_cookieStatement,
  Page_home,
  Page_landing,
  Page_legalIndex,
  Page_post,
  Page_postIndex,
  Page_privacyIndex,
  Page_tagIndex,
  Page_topic,
  Page_topicIndex,
  Person,
  Settings_footer,
  Settings_navigation,
  Settings_site,
  Template_home,
  Template_landing,
  Template_legalIndex,
  Template_postIndex,
  Template_privacyIndex,
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
    | Page_topic
    | Page_privacyIndex
    | Page_legalIndex,
> = TStarterDocument<TPage, 'title' | 'headingBlock' | 'template' | 'seo'>;

export type TStarterModule<
  TModule extends
    | Module_heroBlog
    | Module_heroProfile
    | Module_heroStatement
    | Module_content
    | Module_sectionPages
    | Module_postLatest
    | Module_postList
    | Module_taxonomyList
    | Module_faq
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
  | TStarterDocument<Page_cookieStatement, 'title' | 'content' | 'seo'>
  | TStarterDocument<Template_privacyIndex, 'title'>
  | TStarterPage<Page_privacyIndex>
  | TStarterDocument<Template_legalIndex, 'title'>
  | TStarterPage<Page_legalIndex>
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
  | TStarterModule<Module_cta>
  | TStarterModule<Module_heroProfile>
  | TStarterModule<Module_heroStatement>
  | TStarterModule<Module_content>
  | TStarterModule<Module_sectionPages>
  | TStarterModule<Module_faq>
  | TStarterDocument<Block_faq, 'title' | 'question' | 'answer'>;
