import { schemaTypes } from '@cms/schema-types';
import { authorSchema } from '@cms/schema-types/documents/blog/author';
import { categorySchema } from '@cms/schema-types/documents/blog/category';
import { postSchema } from '@cms/schema-types/documents/blog/post';
import { tagSchema } from '@cms/schema-types/documents/blog/tag';
import { blogPageSchema } from '@cms/schema-types/documents/pages/blog-page';
import { homePageSchema } from '@cms/schema-types/documents/pages/home-page';
import { genericSchema } from '@cms/schema-types/documents/pages/page';
import { footerSchema } from '@cms/schema-types/documents/settings/footer';
import { navigationSchema } from '@cms/schema-types/documents/settings/navigation';
import { siteSchema } from '@cms/schema-types/documents/settings/site-settings';
import { contentSchema } from '@cms/schema-types/modules/module-content';
import { ctaSchema } from '@cms/schema-types/modules/module-cta';
import { heroSchema } from '@cms/schema-types/modules/module-hero';
import { postListSchema } from '@cms/schema-types/modules/module-post-list';
import { codeInput } from '@sanity/code-input';
import { visionTool } from '@sanity/vision';
import {
  Blocks,
  Files,
  FileText,
  House,
  List,
  Megaphone,
  Menu,
  Newspaper,
  PanelBottom,
  Settings,
  Sparkles,
  Tag,
  Tags,
  UserRound,
} from 'lucide-react';
import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';

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
                S.list()
                  .title('Pages')
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
                    S.listItem()
                      .title('Blog Page')
                      .id(blogPageSchema.name)
                      .icon(Newspaper)
                      .child(
                        S.document()
                          .schemaType(blogPageSchema.name)
                          .documentId(blogPageSchema.name),
                      ),
                    S.documentTypeListItem(genericSchema.name)
                      .title('Generic Pages')
                      .icon(FileText),
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
                    S.documentTypeListItem(heroSchema.name)
                      .title('Heroes')
                      .icon(Sparkles),
                    S.documentTypeListItem(postListSchema.name)
                      .title('Post Lists')
                      .icon(List),
                    S.documentTypeListItem(contentSchema.name)
                      .title('Content')
                      .icon(FileText),
                    S.documentTypeListItem(ctaSchema.name)
                      .title('CTAs')
                      .icon(Megaphone),
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
                    S.documentTypeListItem(categorySchema.name)
                      .title('Categories')
                      .icon(Tags),
                    S.documentTypeListItem(tagSchema.name)
                      .title('Tags')
                      .icon(Tag),
                    S.documentTypeListItem(authorSchema.name)
                      .title('Authors')
                      .icon(UserRound),
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
                      .title('Site Settings')
                      .id(siteSchema.name)
                      .icon(Settings)
                      .child(
                        S.document()
                          .schemaType(siteSchema.name)
                          .documentId(siteSchema.name),
                      ),
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
                  ]),
              ),
          ]),
    }),
    visionTool(),
    codeInput(),
  ],

  schema: {
    types: schemaTypes,
  },
});
