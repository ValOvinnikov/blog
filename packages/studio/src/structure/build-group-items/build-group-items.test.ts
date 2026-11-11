import {
  asStructureBuilder,
  mockStructureBuilder,
} from '@blog/studio/testing/structure/mock-structure-builder';
import { mockStructureSchema } from '@blog/studio/testing/structure/mock-structure-schema';
import { faker } from '@faker-js/faker';

import { buildGroupedListItems } from './build-group-items';

faker.seed(2918);

const buildWithSchema = (
  schema: Partial<ReturnType<typeof mockStructureSchema>>,
) =>
  buildGroupedListItems(
    asStructureBuilder(mockStructureBuilder()),
    [{ items: [{ schema: { ...mockStructureSchema(), ...schema } }] }],
    [],
  );

describe(buildGroupedListItems, () => {
  it.each(['title', 'icon'] as const)(
    'refuses a desk schema with no %s, naming the schema and the field',
    (field) => {
      const { name } = mockStructureSchema();

      expect(() => buildWithSchema({ name, [field]: undefined })).toThrow(
        new RegExp(`"${name}".*"${field}"`),
      );
    },
  );
});
