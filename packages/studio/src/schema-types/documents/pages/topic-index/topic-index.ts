import { TAXONOMY_KIND } from '@shinefold/config/constants';
import { taxonomyIndexPage } from '@shinefold/studio/schema-types/documents/pages/taxonomy-index/taxonomy-index-page';
import { PAGE_TOPIC_INDEX_TYPE } from '@shinefold/studio/schema-types/documents/pages/topic-index/topic-index-type';
import { topicIndexTemplateSchema } from '@shinefold/studio/schema-types/documents/templates/topic-index/topic-index';
import { Tags } from 'lucide-react';

export const topicIndexPageSchema = taxonomyIndexPage({
  name: PAGE_TOPIC_INDEX_TYPE,
  title: 'Topic Index Page',
  description:
    'The page that lists every topic, for readers browsing by subject.',
  icon: Tags,
  kind: TAXONOMY_KIND.TOPICS,
  taxonomyKindMismatchError:
    'This page lists topics; the module is set to tags.',
  templateType: topicIndexTemplateSchema.name,
});
