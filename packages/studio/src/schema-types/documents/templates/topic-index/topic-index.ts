import { TAXONOMY_KIND } from '@shinefold/config/constants';
import { taxonomyIndexTemplate } from '@shinefold/studio/schema-types/documents/templates/taxonomy-index/taxonomy-index-template';
import { Tags } from 'lucide-react';

export const topicIndexTemplateSchema = taxonomyIndexTemplate({
  name: 'template_topicIndex',
  title: 'Topic Index Template',
  description: 'The hero and modules the Topic Index page shows.',
  icon: Tags,
  kind: TAXONOMY_KIND.TOPICS,
  taxonomyKindMismatchError:
    'This template lists topics; the module is set to tags.',
});
