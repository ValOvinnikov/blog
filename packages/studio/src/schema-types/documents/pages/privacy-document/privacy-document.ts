import { routes } from '@blog/config';
import { PRIVACY_DOCUMENT_KINDS } from '@blog/config/constants';
import { PAGE_PRIVACY_DOCUMENT_TYPE } from '@blog/studio/schema-types/documents/pages/privacy-document/privacy-document-type';
import { sectionDocumentSchema } from '@blog/studio/schema-types/documents/pages/section-document/section-document';
import { ShieldCheck } from 'lucide-react';

export const privacyDocumentPageSchema = sectionDocumentSchema({
  name: PAGE_PRIVACY_DOCUMENT_TYPE,
  title: 'Privacy Page',
  description:
    "A page in the site's privacy section, such as the privacy policy, at its own address under /privacy.",
  icon: ShieldCheck,
  kinds: PRIVACY_DOCUMENT_KINDS,
  routePrefix: routes.privacyDocument(''),
});
