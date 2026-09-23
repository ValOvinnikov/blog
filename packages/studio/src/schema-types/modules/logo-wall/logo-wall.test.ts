import { logoWallSchema } from '@blog/studio/schema-types/modules/logo-wall/logo-wall';
import { getRecordedBounds } from '@blog/studio/testing/create-mock-validation-rule';
import { getField } from '@blog/studio/testing/get-field';

describe('logoWallSchema logos field validation', () => {
  it('is required, unique, and bounded to one through twelve logos', () => {
    const logosField = getField(logoWallSchema, 'logos');

    expect(getRecordedBounds(logosField)).toEqual({
      required: true,
      unique: true,
      min: 1,
      max: 12,
    });
  });
});
