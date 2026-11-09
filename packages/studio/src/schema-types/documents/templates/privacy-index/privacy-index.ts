import { landingLayoutTemplate } from '@blog/studio/schema-types/documents/templates/landing/landing-layout-template';
import { ShieldCheck } from 'lucide-react';

export const privacyIndexTemplateSchema = landingLayoutTemplate({
  name: 'template_privacyIndex',
  title: 'Privacy Index Template',
  description:
    'The hero and modules the Privacy Index page shows — the same modules a Landing page offers.',
  icon: ShieldCheck,
});
