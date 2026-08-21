import { blogPageSchema } from '@cms/schema-types/documents/pages/blog-page';
import { postListSchema } from '@cms/schema-types/modules/module-post-list';

type TArrayFieldDefinition = {
  type: 'array';
  of?: Array<{ name?: string }>;
};

type TReferenceFieldDefinition = {
  type: 'reference';
  to?: Array<{ type?: string }>;
  validation?: unknown;
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

  it('stays optional — no validation() builder attached', () => {
    const postListField = getPostListField();

    expect(postListField?.validation).toBeUndefined();
  });
});
