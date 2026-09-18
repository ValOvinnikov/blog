import { wasRequiredCalled } from '@blog/studio/testing/was-required-called';

import { headingBlockField } from './heading-block-field';

describe('headingBlockField', () => {
  it('defaults to the shared headingBlock object type', () => {
    const field = headingBlockField();

    expect(field.type).toBe('headingBlock');
  });

  it('carries the shared description', () => {
    const field = headingBlockField();

    expect(field.description).toBe(
      'The heading shown at the top of this page or module, with its optional supporting line.',
    );
  });

  it('is required, so the headingBlock object itself must be present', () => {
    expect(wasRequiredCalled(headingBlockField())).toBe(true);
  });
});
