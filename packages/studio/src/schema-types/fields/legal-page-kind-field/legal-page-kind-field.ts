import type { TLegalPageKind } from '@blog/config/constants';
import {
  LEGAL_PAGE_KIND_FIELD,
  validateUniqueLegalPageKind,
} from '@blog/studio/schema-types/validation/validate-unique-legal-page-kind/validate-unique-legal-page-kind';
import { toTitleCase } from '@blog/utils/primitives';
import { defineField } from 'sanity';

export const legalPageKindField = (kinds: readonly TLegalPageKind[]) =>
  defineField({
    name: LEGAL_PAGE_KIND_FIELD,
    title: 'Kind',
    type: 'string',
    description:
      'What this page is. Only one page of each kind can be published per language; Other pages are unlimited.',
    options: {
      list: kinds.map((value) => ({ title: toTitleCase(value), value })),
    },
    validation: (rule) => rule.required().custom(validateUniqueLegalPageKind),
  });
