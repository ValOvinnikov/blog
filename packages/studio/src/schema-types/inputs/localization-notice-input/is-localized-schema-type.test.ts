import type { TNullable } from '@blog/config/types';
import { isLocalizedSchemaType } from '@blog/studio/schema-types/inputs/localization-notice-input/is-localized-schema-type';
import { faker } from '@faker-js/faker';
import type { SchemaType } from 'sanity';

faker.seed(4101);

const LOCALIZED_STRING_TYPE = 'internationalizedArrayString';
const MOCK_TYPE_NAME = faker.lorem.word();
const MOCK_BASE_TYPE_NAME = faker.lorem.word();

const mockSchemaType = (name: string, parent?: TNullable<SchemaType>) =>
  ({ name, type: parent }) as unknown as SchemaType;

describe(isLocalizedSchemaType, () => {
  it.each([
    {
      chain: 'a plain type with no parent',
      schemaType: mockSchemaType(MOCK_TYPE_NAME),
      expected: false,
    },
    {
      chain: 'a chain that ends in null',
      schemaType: mockSchemaType(
        MOCK_TYPE_NAME,
        mockSchemaType(MOCK_BASE_TYPE_NAME, null),
      ),
      expected: false,
    },
    {
      chain: 'an internationalizedArray type',
      schemaType: mockSchemaType(LOCALIZED_STRING_TYPE),
      expected: true,
    },
    {
      chain: 'a type whose parent is an internationalizedArray type',
      schemaType: mockSchemaType(
        MOCK_TYPE_NAME,
        mockSchemaType(LOCALIZED_STRING_TYPE, null),
      ),
      expected: true,
    },
  ])('is $expected for $chain', ({ schemaType, expected }) => {
    expect(isLocalizedSchemaType(schemaType)).toBe(expected);
  });
});
