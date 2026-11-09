import { landingLayoutTemplate } from '@blog/studio/schema-types/documents/templates/landing/landing-layout-template';
import { Scale } from 'lucide-react';

export const legalIndexTemplateSchema = landingLayoutTemplate({
  name: 'template_legalIndex',
  title: 'Legal Index Template',
  description:
    'The hero and modules the Legal Index page shows — the same modules a Landing page offers.',
  icon: Scale,
});
