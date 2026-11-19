import type { SanityDocument } from '@sanity/client';
import { createMockFaker } from '@worker/testing/mock-faker';

const mockFaker = createMockFaker(4971);

const MOCK_SEEDED_AT = mockFaker.date.past().toISOString();
const MOCK_EDITED_AT = mockFaker.date.recent().toISOString();
export const MOCK_REVISION = mockFaker.string.alphanumeric(22);
export const MOCK_OWNER_DOCUMENT_ID = mockFaker.string.uuid();

export function mockReference(id: string) {
  return { _type: 'reference', _ref: id };
}

export function mockKeyedReference(id: string) {
  return { _key: id, ...mockReference(id) };
}

export function mockSanityDocument(
  _id: string,
  fields: Record<string, unknown> = {},
  { isEdited = false } = {},
): SanityDocument {
  return {
    _id,
    _type: mockFaker.lorem.word(),
    _rev: MOCK_REVISION,
    _createdAt: MOCK_SEEDED_AT,
    _updatedAt: isEdited ? MOCK_EDITED_AT : MOCK_SEEDED_AT,
    ...fields,
  };
}
