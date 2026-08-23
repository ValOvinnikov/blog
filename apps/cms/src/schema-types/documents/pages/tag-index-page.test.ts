import { tagIndexPageSchema } from '@cms/schema-types/documents/pages/tag-index-page';
import { taxonomyListSchema } from '@cms/schema-types/modules/module-taxonomy-list';

type TReferenceFieldDefinition = {
  type: 'reference';
  to?: Array<{ type?: string }>;
  validation?: unknown;
};

type TValidationRule = {
  required: () => TValidationRule;
};

const getField = (name: string) =>
  tagIndexPageSchema.fields?.find((field) => field.name === name);

describe('tagIndexPageSchema taxonomyList field', () => {
  const getTaxonomyListField = () =>
    getField('taxonomyList') as TReferenceFieldDefinition | undefined;

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
    const taxonomyListField = getTaxonomyListField();

    if (!taxonomyListField?.validation) {
      throw new Error(
        'Expected tagIndexPageSchema taxonomyList field to define validation.',
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

describe('tagIndexPageSchema heading field', () => {
  it('is required', () => {
    const headingField = getField('heading');

    if (!headingField?.validation) {
      throw new Error(
        'Expected tagIndexPageSchema heading field to define validation.',
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

describe('tagIndexPageSchema supportingText field', () => {
  it('stays optional — no validation() builder attached', () => {
    const supportingTextField = getField('supportingText');

    expect(supportingTextField?.validation).toBeUndefined();
  });
});
