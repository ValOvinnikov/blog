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
} from '@shinefold/config/sanity/generated/types';

import type {
  TStarterDocument,
  TStarterTemplate,
} from './starter-document-shape';

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
  | 'title'
  | 'slug'
  | 'headingBlock'
  | 'author'
  | 'publishedAt'
  | 'sendToSubscribers'
  | 'seo'
>;

export type TStarterDocumentUnion =
  | TStarterDocument<Settings_navigation, 'title'>
  | TStarterDocument<Settings_footer, 'title'>
  | TStarterDocument<Settings_site, 'title'>
  | TStarterTemplate<Template_home>
  | TStarterPage<Page_home>
  | TStarterTemplate<Template_postIndex>
  | TStarterPage<Page_postIndex>
  | TStarterDocument<
      Page_cookieStatement,
      'title' | 'headingBlock' | 'content' | 'seo'
    >
  | TStarterTemplate<Template_privacyIndex>
  | TStarterPage<Page_privacyIndex>
  | TStarterTemplate<Template_legalIndex>
  | TStarterPage<Page_legalIndex>
  | TStarterTemplate<Template_landing>
  | TStarterPage<Page_landing>
  | TStarterTemplate<Template_topicIndex>
  | TStarterPage<Page_topicIndex>
  | TStarterTemplate<Template_tagIndex>
  | TStarterPage<Page_tagIndex>
  | TStarterTemplate<Template_topic>
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
