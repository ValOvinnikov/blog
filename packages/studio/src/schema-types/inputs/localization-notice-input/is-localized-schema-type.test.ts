import type { SchemaType } from 'sanity';

import { isLocalizedSchemaType } from './is-localized-schema-type';

const chain = (name: string, parent?: unknown) =>
  ({ name, type: parent }) as unknown as SchemaType;

describe(isLocalizedSchemaType, () => {
  it('is false for a chain that ends in undefined', () => {
    expect(isLocalizedSchemaType(chain('string'))).toBe(false);
  });

  it('is false, without throwing, for a chain that ends in null', () => {
    expect(isLocalizedSchemaType(chain('custom', chain('base', null)))).toBe(
      false,
    );
  });

  it('is true for an internationalizedArray type', () => {
    expect(isLocalizedSchemaType(chain('internationalizedArrayString'))).toBe(
      true,
    );
  });

  it('is true when an internationalizedArray type is a parent in the chain', () => {
    expect(
      isLocalizedSchemaType(
        chain('title', chain('internationalizedArrayString', null)),
      ),
    ).toBe(true);
  });
});
