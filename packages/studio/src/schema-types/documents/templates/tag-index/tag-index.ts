import { TAXONOMY_KIND } from '@blog/config/constants';
import { taxonomyIndexTemplate } from '@blog/studio/schema-types/documents/templates/taxonomy-index/taxonomy-index-template';
import { Tag } from 'lucide-react';

export const tagIndexTemplateSchema = taxonomyIndexTemplate({
  name: 'template_tagIndex',
  title: 'Tag Index Template',
  description: 'The hero and modules the Tag Index page shows.',
  icon: Tag,
  kind: TAXONOMY_KIND.TAGS,
  taxonomyKindMismatchError:
    'This template lists tags; the module is set to topics.',
});
