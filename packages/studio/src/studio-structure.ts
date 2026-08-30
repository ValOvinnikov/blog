import { authorSchema } from '@blog/studio/schema-types/documents/blog/author';
import { postSchema } from '@blog/studio/schema-types/documents/blog/post';
import { tagSchema } from '@blog/studio/schema-types/documents/blog/tag';
import { topicSchema } from '@blog/studio/schema-types/documents/blog/topic';
import { footerSchema } from '@blog/studio/schema-types/documents/settings/footer';
import { navigationSchema } from '@blog/studio/schema-types/documents/settings/navigation';
import { newsletterSettingsSchema } from '@blog/studio/schema-types/documents/settings/newsletter';
import { siteSchema } from '@blog/studio/schema-types/documents/settings/site-settings';
import { themeSchema } from '@blog/studio/schema-types/documents/settings/theme';
import { voiceSchema } from '@blog/studio/schema-types/documents/settings/voice';
import { buildGroupedListItems } from '@blog/studio/structure/build-grouped-list';
import { modulesGroups } from '@blog/studio/structure/modules-groups';
import { pagesGroups } from '@blog/studio/structure/pages-groups';
import {
  Blocks,
  Files,
  Mail,
  Menu,
  MessageSquareText,
  Newspaper,
  Palette,
  PanelBottom,
  Settings,
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
