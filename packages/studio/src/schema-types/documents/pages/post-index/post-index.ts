import { indexPage } from '@blog/studio/schema-types/documents/pages/index-page/index-page';
import { PAGE_POST_INDEX_TYPE } from '@blog/studio/schema-types/documents/pages/post-index/post-index-type';
import { postIndexTemplateSchema } from '@blog/studio/schema-types/documents/templates/post-index/post-index';
import { Newspaper } from 'lucide-react';

export const postIndexPageSchema = indexPage({
  name: PAGE_POST_INDEX_TYPE,
  title: 'Post Index Page',
  description:
    "The page that lists posts, built from its heading and its template's hero and modules.",
  icon: Newspaper,
  templateType: postIndexTemplateSchema.name,
});
