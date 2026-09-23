import { logoBlockSchema } from '@blog/studio/schema-types/documents/blocks/logo/logo';
import { getRecordedBounds } from '@blog/studio/testing/create-mock-validation-rule';
import { getField } from '@blog/studio/testing/get-field';

describe('logoBlockSchema field validation', () => {
  it('image field is required', () => {
    const field = getField(logoBlockSchema, 'image');

    expect(getRecordedBounds(field)).toEqual({ required: true });
  });
});
