import { postListSchema } from '@blog/studio/schema-types/modules/post-list/post-list';
import { getField } from '@blog/studio/testing/get-field';

const getPostListField = (name: string) => getField(postListSchema, name);

describe('postListSchema contentAlignment field', () => {
  it('includes a contentAlignment field', () => {
    expect(getPostListField('contentAlignment')).toBeDefined();
  });
});

describe('postListSchema showImages field', () => {
  it('includes a showImages field', () => {
    expect(getPostListField('showImages')).toBeDefined();
  });
});

describe('postListSchema headingBlock field', () => {
  it('is required at the field level', () => {
    const field = getPostListField('headingBlock');

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
