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
  it('blocks publish on an empty heading', () => {
    const field = getField('headingBlock');

    if (!('validation' in field) || typeof field.validation !== 'function') {
      throw new Error('Expected headingBlock field to define validation.');
    }

    let customFn:
      ((value: { heading?: string } | undefined) => string | true) | undefined;

    const rule = {
      custom: (
        fn: (value: { heading?: string } | undefined) => string | true,
      ) => {
        customFn = fn;
        return rule;
      },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- exercising a real Sanity validation builder against a minimal mock Rule
    (field.validation as any)(rule);

    if (!customFn) {
      throw new Error(
        'Expected headingBlock validation to register a custom() rule.',
      );
    }

    expect(customFn(undefined)).toBe('Heading is required.');
    expect(customFn({ heading: 'Latest posts' })).toBe(true);
  });
});
