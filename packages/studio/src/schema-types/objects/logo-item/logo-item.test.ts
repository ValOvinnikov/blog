import { logoItemSchema } from '@blog/studio/schema-types/objects/logo-item/logo-item';
import { getRecordedBounds } from '@blog/studio/testing/create-mock-validation-rule';
import { getField } from '@blog/studio/testing/get-field';

describe('logoItemSchema field validation', () => {
  it('name field is required', () => {
    const field = getField(logoItemSchema, 'name');

    expect(getRecordedBounds(field)).toEqual({ required: true });
  });

  it('image field is required', () => {
    const field = getField(logoItemSchema, 'image');

    expect(getRecordedBounds(field)).toEqual({ required: true });
  });
});
