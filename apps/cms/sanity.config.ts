import { MODULE_TYPE } from '@blog/config/constants';
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
  Tags,
  UserRound,
} from 'lucide-react';
import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';

import { requireEnv } from './sanity-env';
import { schemaTypes } from './src/schema-types';

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
                      .id('page_home')
                      .icon(House)
                      .child(
                        S.document()
                          .schemaType('page_home')
                          .documentId('page_home'),
                      ),
                    S.documentTypeListItem('page_generic')
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
                    S.documentTypeListItem(MODULE_TYPE.HERO)
                      .title('Heroes')
                      .icon(Sparkles),
                    S.documentTypeListItem(MODULE_TYPE.POST_LIST)
                      .title('Post Lists')
                      .icon(List),
                    S.documentTypeListItem(MODULE_TYPE.CONTENT)
                      .title('Content')
                      .icon(FileText),
                    S.documentTypeListItem(MODULE_TYPE.CTA)
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
                    S.documentTypeListItem('post')
                      .title('Posts')
                      .icon(Newspaper),
                    S.documentTypeListItem('category')
                      .title('Categories')
                      .icon(Tags),
                    S.documentTypeListItem('author')
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
                      .id('siteSettings')
                      .icon(Settings)
                      .child(
                        S.document()
                          .schemaType('siteSettings')
                          .documentId('siteSettings'),
                      ),
                    S.listItem()
                      .title('Navigation')
                      .id('settings_navigation')
                      .icon(Menu)
                      .child(
                        S.document()
                          .schemaType('settings_navigation')
                          .documentId('settings_navigation'),
                      ),
                    S.listItem()
                      .title('Footer')
                      .id('settings_footer')
                      .icon(PanelBottom)
                      .child(
                        S.document()
                          .schemaType('settings_footer')
                          .documentId('settings_footer'),
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
