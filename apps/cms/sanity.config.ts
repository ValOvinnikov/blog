import { schemaTypes } from '@cms/schema-types';
import { authorSchema } from '@cms/schema-types/documents/blog/author';
import { postSchema } from '@cms/schema-types/documents/blog/post';
import { tagSchema } from '@cms/schema-types/documents/blog/tag';
import { topicSchema } from '@cms/schema-types/documents/blog/topic';
import { blogPageSchema } from '@cms/schema-types/documents/pages/blog-page';
import { homePageSchema } from '@cms/schema-types/documents/pages/home-page';
import { genericSchema } from '@cms/schema-types/documents/pages/page';
import { pagePostSchema } from '@cms/schema-types/documents/pages/page-post';
import { pageTopicSchema } from '@cms/schema-types/documents/pages/page-topic';
import { topicIndexPageSchema } from '@cms/schema-types/documents/pages/topic-index-page';
import { footerSchema } from '@cms/schema-types/documents/settings/footer';
import { navigationSchema } from '@cms/schema-types/documents/settings/navigation';
import { newsletterSettingsSchema } from '@cms/schema-types/documents/settings/newsletter';
import { siteSchema } from '@cms/schema-types/documents/settings/site-settings';
import { themeSchema } from '@cms/schema-types/documents/settings/theme';
import { voiceSchema } from '@cms/schema-types/documents/settings/voice';
import { contentSchema } from '@cms/schema-types/modules/module-content';
import { ctaSchema } from '@cms/schema-types/modules/module-cta';
import { heroSchema } from '@cms/schema-types/modules/module-hero';
import { newsletterSchema } from '@cms/schema-types/modules/module-newsletter';
import { postLatestSchema } from '@cms/schema-types/modules/module-post-latest';
import { postListSchema } from '@cms/schema-types/modules/module-post-list';
import { taxonomyListSchema } from '@cms/schema-types/modules/module-taxonomy-list';
import { groupedList } from '@cms/structure/grouped-list';
import { codeInput } from '@sanity/code-input';
import { visionTool } from '@sanity/vision';
import {
  Blocks,
  Files,
  FileText,
  House,
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
import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { media } from 'sanity-plugin-media';

import { requireEnv } from './sanity-env';

export default defineConfig({
  name: 'default',
  title: 'Blog',

  // Env-driven (no hardcoded ids in this public repo). Sanity only exposes
  // SANITY_STUDIO_* to the Studio bundle — set them in apps/cms/.env locally.
  projectId: requireEnv(
    'SANITY_STUDIO_PROJECT_ID',
    process.env.SANITY_STUDIO_PROJECT_ID,
  ),
  dataset: requireEnv(
    'SANITY_STUDIO_DATASET',
    process.env.SANITY_STUDIO_DATASET,
  ),

  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Content')
          .items([
            S.listItem()
              .title('Pages')
              .id('pages')
              .icon(Files)
              .child(
                groupedList(S, {
                  id: 'pages',
                  title: 'Pages',
                  groups: [
                    {
                      title: 'Home Page',
                      items: [
                        S.listItem()
                          .title('Home Page')
                          .id(homePageSchema.name)
                          .icon(House)
                          .child(
                            S.document()
                              .schemaType(homePageSchema.name)
                              .documentId(homePageSchema.name),
                          ),
                      ],
                    },
                    {
                      title: 'Blog',
                      items: [
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
                          .icon(Newspaper),
                        S.listItem()
                          .title('Topic Index Page')
                          .id(topicIndexPageSchema.name)
                          .icon(Tags)
                          .child(
                            S.document()
                              .schemaType(topicIndexPageSchema.name)
                              .documentId(topicIndexPageSchema.name),
                          ),
                        S.documentTypeListItem(pageTopicSchema.name)
                          .title('Topic Pages')
                          .icon(Tags),
                      ],
                    },
                    {
                      title: 'General',
                      items: [
                        S.documentTypeListItem(genericSchema.name)
                          .title('Landing Page')
                          .icon(FileText),
                      ],
                    },
                  ],
                }),
              ),
            S.listItem()
              .title('Modules')
              .id('modules')
              .icon(Blocks)
              .child(
                groupedList(S, {
                  id: 'modules',
                  title: 'Modules',
                  groups: [
                    {
                      title: 'Post modules',
                      items: [
                        S.documentTypeListItem(postListSchema.name)
                          .title('Post Lists')
                          .icon(List),
                        S.documentTypeListItem(postLatestSchema.name)
                          .title('Post Latest')
                          .icon(List),
                        S.documentTypeListItem(taxonomyListSchema.name)
                          .title('Taxonomy Lists')
                          .icon(LayoutGrid),
                      ],
                    },
                    {
                      title: 'Content modules',
                      items: [
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
                      ],
                    },
                  ],
                }),
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
                    S.documentTypeListItem(tagSchema.name)
                      .title('Tags')
                      .icon(Tag),
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
          ]),
    }),
    visionTool(),
    codeInput(),
    media(),
  ],

  schema: {
    types: schemaTypes,
  },
});
