import { blogPageSchema } from '@blog/studio/schema-types/documents/pages/blog-page';
import { postListSchema } from '@blog/studio/schema-types/modules/module-post-list';

type TArrayFieldDefinition = {
  type: 'array';
  of?: Array<{ name?: string }>;
};

type TReferenceFieldDefinition = {
  type: 'reference';
  to?: Array<{ type?: string }>;
  validation?: unknown;
};

type TValidationRule = {
  required: () => TValidationRule;
  custom: (fn: unknown) => TValidationRule;
};

describe('blogPageSchema modules allow-list', () => {
  it('permits module_cta and module_newsletter, and excludes module_postList', () => {
    const modulesField = blogPageSchema.fields?.find(
      (field) => field.name === 'modules',
    ) as TArrayFieldDefinition | undefined;

    if (!modulesField || modulesField.type !== 'array' || !modulesField.of) {
      throw new Error(
        'Expected blogPageSchema to define a modules array field.',
      );
    }

    const allowedTypes = modulesField.of.map((member) => member.name);

    expect(allowedTypes).toEqual(['module_cta', 'module_newsletter']);
    expect(allowedTypes).not.toContain('module_postList');
  });
});

describe('blogPageSchema postList field', () => {
  const getPostListField = () =>
    blogPageSchema.fields?.find((field) => field.name === 'postList') as
      TReferenceFieldDefinition | undefined;

  it('references module_postList', () => {
    const postListField = getPostListField();

    if (!postListField || postListField.type !== 'reference') {
      throw new Error(
        'Expected blogPageSchema to define a postList reference field.',
      );
    }

    expect(postListField.to?.map((target) => target.type)).toEqual([
      postListSchema.name,
    ]);
  });

  it('is required', () => {
    const postListField = getPostListField();

    if (!postListField?.validation) {
      throw new Error(
        'Expected blogPageSchema postList field to define validation.',
      );
    }

    let requiredCalled = false;
    const rule: TValidationRule = {
      required: () => {
        requiredCalled = true;
        return rule;
      },
      custom: () => rule,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- exercising a real Sanity validation builder against a minimal mock Rule
    (postListField.validation as any)(rule);

    expect(requiredCalled).toBe(true);
  });
});
