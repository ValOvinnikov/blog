import { routes } from '@blog/config';
import { LEGAL_DOCUMENT_KINDS } from '@blog/config/constants';
import { PAGE_LEGAL_DOCUMENT_TYPE } from '@blog/studio/schema-types/documents/pages/legal-document/legal-document-type';
import { sectionDocumentSchema } from '@blog/studio/schema-types/documents/pages/section-document/section-document';
import { validateLegalDocumentSlug } from '@blog/studio/schema-types/validation/validate-legal-document-slug/validate-legal-document-slug';
import { Scale } from 'lucide-react';

export const legalDocumentPageSchema = sectionDocumentSchema({
  name: PAGE_LEGAL_DOCUMENT_TYPE,
  title: 'Legal Page',
  description:
    "A page in the site's legal section, such as the terms or the imprint, at its own address under /legal.",
  icon: Scale,
  kinds: LEGAL_DOCUMENT_KINDS,
  routePrefix: routes.legalDocument(''),
  validateSlug: validateLegalDocumentSlug,
});
