import { topicIndexPageSchema } from '@blog/studio/schema-types/documents/pages/topic-index-page';
import { taxonomyListSchema } from '@blog/studio/schema-types/modules/module-taxonomy-list';

type TReferenceFieldDefinition = {
  type: 'reference';
  to?: Array<{ type?: string }>;
  validation?: unknown;
};

type TValidationRule = {
  required: () => TValidationRule;
};

const getField = (name: string) =>
  topicIndexPageSchema.fields?.find((field) => field.name === name);

describe('topicIndexPageSchema taxonomyList field', () => {
  const getTaxonomyListField = () =>
    getField('taxonomyList') as TReferenceFieldDefinition | undefined;

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
    const taxonomyListField = getTaxonomyListField();

    if (!taxonomyListField?.validation) {
      throw new Error(
        'Expected topicIndexPageSchema taxonomyList field to define validation.',
      );
    }

    let requiredCalled = false;
    const rule: TValidationRule = {
      required: () => {
        requiredCalled = true;
        return rule;
      },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- exercising a real Sanity validation builder against a minimal mock Rule
    (taxonomyListField.validation as any)(rule);

    expect(requiredCalled).toBe(true);
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
    const rule: TValidationRule = {
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
