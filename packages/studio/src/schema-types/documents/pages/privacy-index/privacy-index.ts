import { routes } from '@blog/config';
import { indexPage } from '@blog/studio/schema-types/documents/pages/index-page/index-page';
import { PAGE_PRIVACY_INDEX_TYPE } from '@blog/studio/schema-types/documents/pages/privacy-index/privacy-index-type';
import { privacyIndexTemplateSchema } from '@blog/studio/schema-types/documents/templates/privacy-index/privacy-index';
import { ShieldCheck } from 'lucide-react';

export const privacyIndexPageSchema = indexPage({
  name: PAGE_PRIVACY_INDEX_TYPE,
  title: 'Privacy Index Page',
  description: `The entry page of the privacy section, at ${routes.privacy()}, built from its heading and its template's hero and modules. Use it to link the privacy policy and the site's other privacy pages.`,
  icon: ShieldCheck,
  templateType: privacyIndexTemplateSchema.name,
});
