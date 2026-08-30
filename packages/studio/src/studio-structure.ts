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
  buildGroupedListItems,
  type TStructureGroup,
} from '@blog/studio/structure/build-grouped-list';
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

const pagesGroups: TStructureGroup[] = [
  {
    title: 'Home',
    items: [
      {
        documentType: homePageSchema.name,
        title: 'Home Page',
        icon: House,
        mode: 'singleton',
      },
    ],
  },
  {
    title: 'Blog',
    items: [
      {
        documentType: blogPageSchema.name,
        title: 'Post Index Page',
        icon: Newspaper,
        mode: 'singleton',
      },
      {
        documentType: pagePostSchema.name,
        title: 'Post Pages',
        icon: FileText,
      },
      {
        documentType: topicIndexPageSchema.name,
        title: 'Topic Index Page',
        icon: LayoutGrid,
        mode: 'singleton',
      },
      {
        documentType: pageTopicSchema.name,
        title: 'Topic Pages',
        icon: Layers,
      },
      {
        documentType: tagIndexPageSchema.name,
        title: 'Tag Index Page',
        icon: Tags,
        mode: 'singleton',
      },
      { documentType: pageTagSchema.name, title: 'Tag Pages', icon: Tag },
    ],
  },
  {
    title: 'General',
    items: [
      {
        documentType: genericSchema.name,
        title: 'Landing Page',
        icon: FileText,
      },
    ],
  },
];

const modulesGroups: TStructureGroup[] = [
  {
    title: 'Post modules',
    items: [
      { documentType: postListSchema.name, title: 'Post Lists', icon: List },
      {
        documentType: postLatestSchema.name,
        title: 'Post Latest',
        icon: Clock,
      },
      {
        documentType: taxonomyListSchema.name,
        title: 'Taxonomy Lists',
        icon: LayoutGrid,
      },
    ],
  },
  {
    title: 'Content modules',
    items: [
      { documentType: heroSchema.name, title: 'Heroes', icon: Sparkles },
      { documentType: contentSchema.name, title: 'Content', icon: FileText },
      { documentType: ctaSchema.name, title: 'CTAs', icon: Megaphone },
      {
        documentType: newsletterSchema.name,
        title: 'Newsletter Signups',
        icon: Mail,
      },
    ],
  },
];

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
          S.list().title('Pages').items(buildGroupedListItems(S, pagesGroups)),
        ),
      S.listItem()
        .title('Modules')
        .id('modules')
        .icon(Blocks)
        .child(
          S.list()
            .title('Modules')
            .items(buildGroupedListItems(S, modulesGroups)),
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
