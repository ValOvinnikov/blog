import { TAXONOMY_KIND } from '@blog/config/constants';
import { topicIndexPageSchema } from '@blog/studio/schema-types/documents/pages/topic-index-page';
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
  topicIndexPageSchema.fields?.find((field) => field.name === name);

const getTaxonomyListField = () =>
  getField('taxonomyList') as TReferenceFieldDefinition | undefined;

const getTaxonomyListValidator = () => {
  const taxonomyListField = getTaxonomyListField();

  if (!taxonomyListField?.validation) {
    throw new Error(
      'Expected topicIndexPageSchema taxonomyList field to define validation.',
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

describe('topicIndexPageSchema taxonomyList field', () => {
  it('references module_taxonomyList', () => {
    const taxonomyListField = getTaxonomyListField();

    if (!taxonomyListField || taxonomyListField.type !== 'reference') {
      throw new Error(
        'Expected topicIndexPageSchema to define a taxonomyList reference field.',
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

  it('passes when the referenced module lists topics', async () => {
    const { customFn } = getTaxonomyListValidator();

    await expect(
      customFn(
        { _ref: 'taxonomy-list-1' },
        createMockContext({ taxonomy: TAXONOMY_KIND.TOPICS }),
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

  it('fails when the referenced module lists tags', async () => {
    const { customFn } = getTaxonomyListValidator();

    await expect(
      customFn(
        { _ref: 'taxonomy-list-1' },
        createMockContext({ taxonomy: TAXONOMY_KIND.TAGS }),
      ),
    ).resolves.toBe('This page lists topics; the module is set to tags.');
  });
});

describe('topicIndexPageSchema heading field', () => {
  it('is required', () => {
    const headingField = getField('heading');

    if (!headingField?.validation) {
      throw new Error(
        'Expected topicIndexPageSchema heading field to define validation.',
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

describe('topicIndexPageSchema supportingText field', () => {
  it('stays optional — no validation() builder attached', () => {
    const supportingTextField = getField('supportingText');

    expect(supportingTextField?.validation).toBeUndefined();
  });
});
