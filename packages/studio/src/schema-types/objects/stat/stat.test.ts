import { statSchema } from '@blog/studio/schema-types/objects/stat/stat';
import { getRecordedBounds } from '@blog/studio/testing/create-mock-validation-rule';
import { getField } from '@blog/studio/testing/get-field';

describe('statSchema value field validation', () => {
  it('is required and bounded to a maximum of 8 characters', () => {
    const valueField = getField(statSchema, 'value');

    expect(getRecordedBounds(valueField)).toEqual({
      required: true,
      max: 8,
    });
  });
});

describe('statSchema label field validation', () => {
  it('is required and bounded to a maximum of 48 characters', () => {
    const labelField = getField(statSchema, 'label');

    expect(getRecordedBounds(labelField)).toEqual({
      required: true,
      max: 48,
    });
  });
});
