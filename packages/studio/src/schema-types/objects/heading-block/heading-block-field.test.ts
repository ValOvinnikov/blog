import { headingBlockField } from './heading-block-field';

const wasRequiredCalled = (field: { validation?: unknown }) => {
  if (!field.validation) {
    throw new Error('Expected field to define validation.');
  }

  let requiredCalled = false;
  const rule = {
    required: () => {
      requiredCalled = true;
      return rule;
    },
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- exercising a real Sanity validation builder against a minimal mock Rule
  (field.validation as any)(rule);

  return requiredCalled;
};

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
