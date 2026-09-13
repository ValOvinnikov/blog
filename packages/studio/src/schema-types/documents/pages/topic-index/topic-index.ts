import { TAXONOMY_KIND } from '@blog/config/constants';
import { taxonomyIndexPage } from '@blog/studio/schema-types/documents/pages/taxonomy-index/taxonomy-index-page';
import { PAGE_TOPIC_INDEX_TYPE } from '@blog/studio/schema-types/documents/pages/topic-index/topic-index-type';
import { Tags } from 'lucide-react';

export const topicIndexPageSchema = taxonomyIndexPage({
  name: PAGE_TOPIC_INDEX_TYPE,
  title: 'Topic Index Page',
  description:
    'The page that lists every topic, for readers browsing by subject.',
  icon: Tags,
  kind: TAXONOMY_KIND.TOPICS,
  noTaxonomyListWarning:
    'This page has no Taxonomy List module — the topic list will be empty until one is added.',
  taxonomyKindMismatchError:
    'This page lists topics; the module is set to tags.',
  previewSubtitle: 'Topic index singleton',
});
