import { logoBlockSchema } from '@blog/studio/schema-types/documents/blocks/logo/logo';
import { getRecordedBounds } from '@blog/studio/testing/create-mock-validation-rule';
import { getField } from '@blog/studio/testing/get-field';

describe('logoBlockSchema field validation', () => {
  it.each([['name'], ['image']])('%s field is required', (fieldName) => {
    const field = getField(logoBlockSchema, fieldName);

    expect(getRecordedBounds(field)).toEqual({ required: true });
  });
});
