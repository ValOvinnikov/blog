import { codeInput } from '@sanity/code-input';
import { visionTool } from '@sanity/vision';
import {
  Files,
  FileText,
  House,
  Link2,
  Newspaper,
  Settings,
  Tags,
  UserRound,
} from 'lucide-react';
import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';

import { schemaTypes } from './src/schema-types';

export default defineConfig({
  name: 'default',
  title: 'Blog',

  projectId: 'ccs8c2no',
  dataset: 'production',

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
                      .id('homePage')
                      .icon(House)
                      .child(
                        S.document()
                          .schemaType('homePage')
                          .documentId('homePage'),
                      ),
                    S.documentTypeListItem('page')
                      .title('Generic Pages')
                      .icon(FileText),
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
                    S.documentTypeListItem('link').title('Links').icon(Link2),
                    S.listItem()
                      .title('Site Settings')
                      .id('siteSettings')
                      .icon(Settings)
                      .child(
                        S.document()
                          .schemaType('siteSettings')
                          .documentId('siteSettings'),
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
