import { faker } from '@faker-js/faker';

type TMockValidationLevel = 'error' | 'warning' | 'info';

type TMockSanityValidationResult = {
  documentId: string;
  documentType: string;
  level: TMockValidationLevel;
  markers: { level: TMockValidationLevel; message: string }[];
};

export const MOCK_DOCUMENT_TYPE = 'page_post';

export function mockSanityValidationResult(
  overrides: Partial<TMockSanityValidationResult> = {},
): TMockSanityValidationResult {
  const level = overrides.level ?? 'warning';

  return {
    documentId: faker.string.uuid(),
    documentType: MOCK_DOCUMENT_TYPE,
    level,
    markers: [{ level, message: faker.lorem.sentence() }],
    ...overrides,
  };
}
