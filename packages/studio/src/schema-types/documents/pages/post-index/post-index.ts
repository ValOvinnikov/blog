import { PAGE_POST_INDEX_TYPE } from '@blog/studio/schema-types/documents/pages/post-index/post-index-type';
import { postIndexTemplateSchema } from '@blog/studio/schema-types/documents/templates/post-index/post-index';
import { templateField } from '@blog/studio/schema-types/fields/template-field/template-field';
import { titleField } from '@blog/studio/schema-types/fields/title-field/title-field';
import { headingBlockField } from '@blog/studio/schema-types/objects/heading-block/heading-block-field';
import { seoField } from '@blog/studio/schema-types/objects/seo/seo-field';
import { Newspaper } from 'lucide-react';
import { defineType } from 'sanity';

export const postIndexPageSchema = defineType({
  name: PAGE_POST_INDEX_TYPE,
  title: 'Post Index Page',
  type: 'document',
  description:
    "The page that lists posts, built from its heading and its template's hero and modules.",
  icon: Newspaper,
  preview: {
    select: {
      title: 'title',
    },
    prepare({ title }) {
      return {
        title: title ?? 'Unknown',
        subtitle: 'Blog singleton',
      };
    },
  },
  fields: [
    titleField(),
    headingBlockField(),
    templateField({ type: postIndexTemplateSchema.name }),
    seoField(),
  ],
});
