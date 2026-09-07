import { TAXONOMY_KIND } from '@blog/config/constants';
import { tagIndexPageSchema } from '@blog/studio/schema-types/documents/pages/tag-index-page';
import { taxonomyListSchema } from '@blog/studio/schema-types/modules/module-taxonomy-list';
import type { ValidationContext } from 'sanity';

type TReferenceFieldDefinition = {
  type: 'reference';
  to?: Array<{ type?: string }>;
  validation?: unknown;
};

type TReference = { _ref?: string } | undefined;
type TCustomFn = (
  value: TReference,
  context: ValidationContext,
) => Promise<string | true>;

type TValidationRule = {
  required: () => TValidationRule;
  custom: (fn: TCustomFn) => TValidationRule;
};

const getField = (name: string) =>
  tagIndexPageSchema.fields?.find((field) => field.name === name);

const getTaxonomyListField = () =>
  getField('taxonomyList') as TReferenceFieldDefinition | undefined;

const getTaxonomyListValidator = () => {
  const taxonomyListField = getTaxonomyListField();

  if (!taxonomyListField?.validation) {
    throw new Error(
      'Expected tagIndexPageSchema taxonomyList field to define validation.',
    );
  }

  let requiredCalled = false;
  let customFn: TCustomFn | undefined;
  const rule: TValidationRule = {
    required: () => {
      requiredCalled = true;
      return rule;
    },
    custom: (fn) => {
      customFn = fn;
      return rule;
    },
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- exercising a real Sanity validation builder against a minimal mock Rule
  (taxonomyListField.validation as any)(rule);

  if (!customFn) {
    throw new Error(
      'Expected taxonomyList validation to register a custom() rule.',
    );
  }

  return { requiredCalled, customFn };
};

const createMockContext = (candidate: { taxonomy?: string | null } | null) =>
  ({
    getClient: () => ({
      withConfig: () => ({
        fetch: async () => candidate,
      }),
    }),
  }) as unknown as ValidationContext;

describe('tagIndexPageSchema taxonomyList field', () => {
  it('references module_taxonomyList', () => {
    const taxonomyListField = getTaxonomyListField();

    if (!taxonomyListField || taxonomyListField.type !== 'reference') {
      throw new Error(
        'Expected tagIndexPageSchema to define a taxonomyList reference field.',
      );
    }

    expect(taxonomyListField.to?.map((target) => target.type)).toEqual([
      taxonomyListSchema.name,
    ]);
  });

  it('is required', () => {
    const { requiredCalled } = getTaxonomyListValidator();

    expect(requiredCalled).toBe(true);
  });

  it('passes when the referenced module has no reference value yet', async () => {
    const { customFn } = getTaxonomyListValidator();

    await expect(customFn(undefined, createMockContext(null))).resolves.toBe(
      true,
    );
  });

  it('passes when the referenced module lists tags', async () => {
    const { customFn } = getTaxonomyListValidator();

    await expect(
      customFn(
        { _ref: 'taxonomy-list-1' },
        createMockContext({ taxonomy: TAXONOMY_KIND.TAGS }),
      ),
    ).resolves.toBe(true);
  });

  it('passes when the referenced module has no taxonomy set', async () => {
    const { customFn } = getTaxonomyListValidator();

    await expect(
      customFn(
        { _ref: 'taxonomy-list-1' },
        createMockContext({ taxonomy: undefined }),
      ),
    ).resolves.toBe(true);
  });

  it('fails when the referenced module lists topics', async () => {
    const { customFn } = getTaxonomyListValidator();

    await expect(
      customFn(
        { _ref: 'taxonomy-list-1' },
        createMockContext({ taxonomy: TAXONOMY_KIND.TOPICS }),
      ),
    ).resolves.toBe('This page lists tags; the module is set to topics.');
  });
});

describe('tagIndexPageSchema heading field', () => {
  it('is required', () => {
    const headingField = getField('heading');

    if (!headingField?.validation) {
      throw new Error(
        'Expected tagIndexPageSchema heading field to define validation.',
      );
    }

    let requiredCalled = false;
    const rule = {
      required: () => {
        requiredCalled = true;
        return rule;
      },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- exercising a real Sanity validation builder against a minimal mock Rule
    (headingField.validation as any)(rule);

    expect(requiredCalled).toBe(true);
  });
});

describe('tagIndexPageSchema supportingText field', () => {
  it('stays optional — no validation() builder attached', () => {
    const supportingTextField = getField('supportingText');

    expect(supportingTextField?.validation).toBeUndefined();
  });
});
