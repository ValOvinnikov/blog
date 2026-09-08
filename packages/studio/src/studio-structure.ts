import { footerSchema } from '@blog/studio/schema-types/documents/settings/footer';
import { navigationSchema } from '@blog/studio/schema-types/documents/settings/navigation';
import { siteSchema } from '@blog/studio/schema-types/documents/settings/site-settings';
import { themeSchema } from '@blog/studio/schema-types/documents/settings/theme';
import { blogGroups } from '@blog/studio/structure/blog-groups';
import {
  buildGroupedListItems,
  buildListItems,
} from '@blog/studio/structure/build-grouped-list';
import { modulesGroups } from '@blog/studio/structure/modules-groups';
import { pagesItems } from '@blog/studio/structure/pages-items';
import {
  Blocks,
  Files,
  Menu,
  Newspaper,
  Palette,
  PanelBottom,
  Settings,
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
        .child(S.list().title('Pages').items(buildListItems(S, pagesItems))),
      S.listItem()
        .title('Blog')
        .id('blog')
        .icon(Newspaper)
        .child(
          S.list().title('Blog').items(buildGroupedListItems(S, blogGroups)),
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
