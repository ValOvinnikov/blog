import { faker } from '@faker-js/faker';
import type {
  TDocumentValidationDetails,
  TSanityValidationResult,
} from '@platform/components/features/tenants/findings-card/components/finding-details/parse-document-validation-details';

export const mockValidationResult = (
  overrides: Partial<TSanityValidationResult> = {},
): TSanityValidationResult => ({
  documentId: faker.string.uuid(),
  documentType: faker.word.noun(),
  markers: [{ level: 'warning', message: faker.lorem.sentence() }],
  ...overrides,
});

export const mockDocumentValidationDetails = (
  overrides: Partial<TDocumentValidationDetails> = {},
): TDocumentValidationDetails => {
  const documents = overrides.documents ?? [mockValidationResult()];

  return {
    invalidDocumentCount: documents.length,
    documents,
    ...overrides,
  };
};
