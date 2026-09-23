import { TAXONOMY_KIND } from '@blog/config/constants';
import { PAGE_TAG_INDEX_TYPE } from '@blog/studio/schema-types/documents/pages/tag-index/tag-index-type';
import { taxonomyIndexPage } from '@blog/studio/schema-types/documents/pages/taxonomy-index/taxonomy-index-page';
import { Tag } from 'lucide-react';

export const tagIndexPageSchema = taxonomyIndexPage({
  name: PAGE_TAG_INDEX_TYPE,
  title: 'Tag Index Page',
  description:
    'The page that lists every tag, for readers browsing by keyword.',
  icon: Tag,
  kind: TAXONOMY_KIND.TAGS,
  taxonomyKindMismatchError:
    'This page lists tags; the module is set to topics.',
  previewSubtitle: 'Tag index singleton',
});
