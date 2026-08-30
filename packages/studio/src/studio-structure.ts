import { authorSchema } from '@blog/studio/schema-types/documents/blog/author';
import { postSchema } from '@blog/studio/schema-types/documents/blog/post';
import { tagSchema } from '@blog/studio/schema-types/documents/blog/tag';
import { topicSchema } from '@blog/studio/schema-types/documents/blog/topic';
import { blogPageSchema } from '@blog/studio/schema-types/documents/pages/blog-page';
import { homePageSchema } from '@blog/studio/schema-types/documents/pages/home-page';
import { genericSchema } from '@blog/studio/schema-types/documents/pages/page';
import { pagePostSchema } from '@blog/studio/schema-types/documents/pages/page-post';
import { pageTagSchema } from '@blog/studio/schema-types/documents/pages/page-tag';
import { pageTopicSchema } from '@blog/studio/schema-types/documents/pages/page-topic';
import { tagIndexPageSchema } from '@blog/studio/schema-types/documents/pages/tag-index-page';
import { topicIndexPageSchema } from '@blog/studio/schema-types/documents/pages/topic-index-page';
import { footerSchema } from '@blog/studio/schema-types/documents/settings/footer';
import { navigationSchema } from '@blog/studio/schema-types/documents/settings/navigation';
import { newsletterSettingsSchema } from '@blog/studio/schema-types/documents/settings/newsletter';
import { siteSchema } from '@blog/studio/schema-types/documents/settings/site-settings';
import { themeSchema } from '@blog/studio/schema-types/documents/settings/theme';
import { voiceSchema } from '@blog/studio/schema-types/documents/settings/voice';
import { contentSchema } from '@blog/studio/schema-types/modules/module-content';
import { ctaSchema } from '@blog/studio/schema-types/modules/module-cta';
import { heroSchema } from '@blog/studio/schema-types/modules/module-hero';
import { newsletterSchema } from '@blog/studio/schema-types/modules/module-newsletter';
import { postLatestSchema } from '@blog/studio/schema-types/modules/module-post-latest';
import { postListSchema } from '@blog/studio/schema-types/modules/module-post-list';
import { taxonomyListSchema } from '@blog/studio/schema-types/modules/module-taxonomy-list';
import {
  Blocks,
  Clock,
  Files,
  FileText,
  House,
  Layers,
  LayoutGrid,
  List,
  Mail,
  Megaphone,
  Menu,
  MessageSquareText,
  Newspaper,
  Palette,
  PanelBottom,
  Settings,
  Sparkles,
  Tag,
  Tags,
  UserRound,
} from 'lucide-react';
import type { StructureResolver } from 'sanity/structure';

/** The desk structure shared by every Studio entry point (CLI + mount component). */
export const studioStructure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      S.listItem()
        .title('Pages')
        .id('pages')
        .icon(Files)
        .child(
          S.list()
            .title('Pages')
            .items([
              S.listItem()
                .title('Home Page')
                .id('home-page')
                .icon(House)
                .child(
                  S.list()
                    .title('Home Page')
                    .items([
                      S.listItem()
                        .title('Home Page')
                        .id(homePageSchema.name)
                        .icon(House)
                        .child(
                          S.document()
                            .schemaType(homePageSchema.name)
                            .documentId(homePageSchema.name),
                        ),
                    ]),
                ),
              S.listItem()
                .title('Blog')
                .id('pages-blog')
                .icon(Newspaper)
                .child(
                  S.list()
                    .title('Blog')
                    .items([
                      S.listItem()
                        .title('Post Index Page')
                        .id(blogPageSchema.name)
                        .icon(Newspaper)
                        .child(
                          S.document()
                            .schemaType(blogPageSchema.name)
                            .documentId(blogPageSchema.name),
                        ),
                      S.documentTypeListItem(pagePostSchema.name)
                        .title('Post Pages')
                        .icon(FileText),
                      S.listItem()
                        .title('Topic Index Page')
                        .id(topicIndexPageSchema.name)
                        .icon(LayoutGrid)
                        .child(
                          S.document()
                            .schemaType(topicIndexPageSchema.name)
                            .documentId(topicIndexPageSchema.name),
                        ),
                      S.documentTypeListItem(pageTopicSchema.name)
                        .title('Topic Pages')
                        .icon(Layers),
                      S.listItem()
                        .title('Tag Index Page')
                        .id(tagIndexPageSchema.name)
                        .icon(Tags)
                        .child(
                          S.document()
                            .schemaType(tagIndexPageSchema.name)
                            .documentId(tagIndexPageSchema.name),
                        ),
                      S.documentTypeListItem(pageTagSchema.name)
                        .title('Tag Pages')
                        .icon(Tag),
                    ]),
                ),
              S.listItem()
                .title('General')
                .id('pages-general')
                .icon(FileText)
                .child(
                  S.list()
                    .title('General')
                    .items([
                      S.documentTypeListItem(genericSchema.name)
                        .title('Landing Page')
                        .icon(FileText),
                    ]),
                ),
            ]),
        ),
      S.listItem()
        .title('Modules')
        .id('modules')
        .icon(Blocks)
        .child(
          S.list()
            .title('Modules')
            .items([
              S.listItem()
                .title('Post modules')
                .id('post-modules')
                .icon(List)
                .child(
                  S.list()
                    .title('Post modules')
                    .items([
                      S.documentTypeListItem(postListSchema.name)
                        .title('Post Lists')
                        .icon(List),
                      S.documentTypeListItem(postLatestSchema.name)
                        .title('Post Latest')
                        .icon(Clock),
                      S.documentTypeListItem(taxonomyListSchema.name)
                        .title('Taxonomy Lists')
                        .icon(LayoutGrid),
                    ]),
                ),
              S.listItem()
                .title('Content modules')
                .id('content-modules')
                .icon(FileText)
                .child(
                  S.list()
                    .title('Content modules')
                    .items([
                      S.documentTypeListItem(heroSchema.name)
                        .title('Heroes')
                        .icon(Sparkles),
                      S.documentTypeListItem(contentSchema.name)
                        .title('Content')
                        .icon(FileText),
                      S.documentTypeListItem(ctaSchema.name)
                        .title('CTAs')
                        .icon(Megaphone),
                      S.documentTypeListItem(newsletterSchema.name)
                        .title('Newsletter Signups')
                        .icon(Mail),
                    ]),
                ),
            ]),
        ),
      S.listItem()
        .title('Blog')
        .id('blog')
        .icon(Newspaper)
        .child(
          S.list()
            .title('Blog')
            .items([
              S.documentTypeListItem(postSchema.name)
                .title('Posts')
                .icon(Newspaper),
              S.documentTypeListItem(topicSchema.name)
                .title('Topics')
                .icon(Tags),
              S.documentTypeListItem(tagSchema.name).title('Tags').icon(Tag),
              S.documentTypeListItem(authorSchema.name)
                .title('Authors')
                .icon(UserRound),
              S.divider(),
              S.listItem()
                .title('Settings')
                .id('blog-settings')
                .icon(Settings)
                .child(
                  S.list()
                    .title('Settings')
                    .items([
                      S.listItem()
                        .title('Newsletter')
                        .id(newsletterSettingsSchema.name)
                        .icon(Mail)
                        .child(
                          S.document()
                            .schemaType(newsletterSettingsSchema.name)
                            .documentId(newsletterSettingsSchema.name),
                        ),
                    ]),
                ),
            ]),
        ),
      S.divider(),
      S.listItem()
        .title('Settings')
        .id('settings')
        .icon(Settings)
        .child(
          S.list()
            .title('Settings')
            .items([
              S.listItem()
                .title('Navigation')
                .id(navigationSchema.name)
                .icon(Menu)
                .child(
                  S.document()
                    .schemaType(navigationSchema.name)
                    .documentId(navigationSchema.name),
                ),
              S.listItem()
                .title('Footer')
                .id(footerSchema.name)
                .icon(PanelBottom)
                .child(
                  S.document()
                    .schemaType(footerSchema.name)
                    .documentId(footerSchema.name),
                ),
              S.listItem()
                .title('Theme')
                .id(themeSchema.name)
                .icon(Palette)
                .child(
                  S.document()
                    .schemaType(themeSchema.name)
                    .documentId(themeSchema.name),
                ),
              S.listItem()
                .title('Voice')
                .id(voiceSchema.name)
                .icon(MessageSquareText)
                .child(
                  S.document()
                    .schemaType(voiceSchema.name)
                    .documentId(voiceSchema.name),
                ),
              S.divider(),
              S.listItem()
                .title('Site Settings')
                .id(siteSchema.name)
                .icon(Settings)
                .child(
                  S.document()
                    .schemaType(siteSchema.name)
                    .documentId(siteSchema.name),
                ),
            ]),
        ),
    ]);
