import { routes } from '@blog/config';
import { indexPage } from '@blog/studio/schema-types/documents/pages/index-page/index-page';
import { PAGE_LEGAL_INDEX_TYPE } from '@blog/studio/schema-types/documents/pages/legal-index/legal-index-type';
import { legalIndexTemplateSchema } from '@blog/studio/schema-types/documents/templates/legal-index/legal-index';
import { Scale } from 'lucide-react';

export const legalIndexPageSchema = indexPage({
  name: PAGE_LEGAL_INDEX_TYPE,
  title: 'Legal Index Page',
  description: `The entry page of the legal section, at ${routes.legal()}, built from its heading and its template's hero and modules. Use it to link the terms, the imprint, the cookie statement and the site's other legal pages.`,
  icon: Scale,
  templateType: legalIndexTemplateSchema.name,
});
