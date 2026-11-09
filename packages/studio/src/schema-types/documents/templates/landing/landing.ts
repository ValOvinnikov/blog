import { landingLayoutTemplate } from '@blog/studio/schema-types/documents/templates/landing/landing-layout-template';
import { FileText } from 'lucide-react';

export const landingTemplateSchema = landingLayoutTemplate({
  name: 'template_landing',
  title: 'Landing Template',
  description: 'The hero and modules a Landing page shows.',
  icon: FileText,
});
