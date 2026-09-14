import { postListSchema } from '@blog/studio/schema-types/modules/post-list/post-list';

const getField = (name: string) => {
  const field = postListSchema.fields?.find(
    (field): field is typeof field & { name: string } =>
      'name' in field && field.name === name,
  );

  if (!field) {
    throw new Error(`Expected postListSchema to define a "${name}" field.`);
  }

  return field;
};

describe('postListSchema contentAlignment field', () => {
  it('includes a contentAlignment field', () => {
    expect(getField('contentAlignment')).toBeDefined();
  });
});

describe('postListSchema showImages field', () => {
  it('includes a showImages field', () => {
    expect(getField('showImages')).toBeDefined();
  });
});

describe('postListSchema headingBlock field', () => {
  it('is required at the field level', () => {
    const field = getField('headingBlock');

    if (typeof field.validation !== 'function') {
      throw new Error('Expected headingBlock field to define validation.');
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

    expect(requiredCalled).toBe(true);
  });
});
