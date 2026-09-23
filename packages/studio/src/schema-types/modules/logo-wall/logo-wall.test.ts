import { logoWallSchema } from '@blog/studio/schema-types/modules/logo-wall/logo-wall';
import { getRecordedBounds } from '@blog/studio/testing/create-mock-validation-rule';
import { getField } from '@blog/studio/testing/get-field';

describe('logoWallSchema logos field validation', () => {
  it('is required, unique, and bounded to three through twelve references', () => {
    const logosField = getField(logoWallSchema, 'logos');

    expect(getRecordedBounds(logosField)).toEqual({
      required: true,
      unique: true,
      min: 3,
      max: 12,
    });
  });
});
