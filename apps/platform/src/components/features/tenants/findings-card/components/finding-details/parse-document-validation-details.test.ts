import { faker } from '@faker-js/faker';
import {
  mockDocumentValidationDetails,
  mockValidationResult,
} from '@platform/testing/features/tenants/findings-card/fixtures';

import { parseDocumentValidationDetails } from './parse-document-validation-details';

faker.seed(5994);

describe(parseDocumentValidationDetails, () => {
  it('parses the document validation shape', () => {
    const details = mockDocumentValidationDetails();

    expect(parseDocumentValidationDetails(details)).toEqual(details);
  });

  it.each([
    ['the document count is missing', { documents: [mockValidationResult()] }],
    ['the documents are missing', { invalidDocumentCount: 1 }],
    [
      'a marker has an unrecognised level',
      {
        invalidDocumentCount: 1,
        documents: [
          {
            ...mockValidationResult(),
            markers: [{ level: 'critical', message: faker.lorem.sentence() }],
          },
        ],
      },
    ],
    ['the shape is unrelated', { step: faker.word.noun() }],
  ])('returns null when %s', (_case, details) => {
    expect(parseDocumentValidationDetails(details)).toBeNull();
  });
});
