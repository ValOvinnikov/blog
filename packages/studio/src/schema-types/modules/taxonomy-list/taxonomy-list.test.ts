import { TAXONOMY_KIND, TAXONOMY_SORT } from '@blog/config/constants';
import { taxonomyListSchema } from '@blog/studio/schema-types/modules/taxonomy-list/taxonomy-list';
import { getField } from '@blog/studio/testing/get-field';

type TValidationRule = {
  integer: () => TValidationRule;
  min: (value: number) => TValidationRule;
};

const getTaxonomyListField = (name: string) =>
  getField(taxonomyListSchema, name);

const getOptions = (field: ReturnType<typeof getTaxonomyListField>) => {
  const options = 'options' in field ? field.options : undefined;

  if (!options || typeof options !== 'object') {
    throw new Error('Expected field to define options.');
  }

  return options as {
    layout?: string;
    list?: { title: string; value: string }[];
  };
};

const getOptionValues = (field: ReturnType<typeof getTaxonomyListField>) => {
  const { list } = getOptions(field);

  if (!list) {
    throw new Error('Expected field to define an options.list.');
  }

  return list.map((option) => option.value);
};

describe('taxonomyListSchema contentAlignment field', () => {
  it('includes a contentAlignment field', () => {
    expect(getTaxonomyListField('contentAlignment')).toBeDefined();
  });
});

describe('taxonomyListSchema taxonomy field', () => {
  it('is a select list over the taxonomy kinds', () => {
    const field = getTaxonomyListField('taxonomy');

    expect(field.type).toBe('string');
    expect(getOptions(field).layout).toBe('dropdown');
    expect(getOptionValues(field)).toEqual([
      TAXONOMY_KIND.TOPICS,
      TAXONOMY_KIND.TAGS,
    ]);
  });

  it('has no initial value and no validation — it is optional', () => {
    const field = getTaxonomyListField('taxonomy');

    expect(field.initialValue).toBeUndefined();
    expect(
      'validation' in field ? field.validation : undefined,
    ).toBeUndefined();
  });

  it('defines no hidden() callback', () => {
    const field = getTaxonomyListField('taxonomy');

    expect('hidden' in field ? field.hidden : undefined).toBeUndefined();
  });
});

describe('taxonomyListSchema sortOrder field', () => {
  it('is a select list over the sort orders', () => {
    const field = getTaxonomyListField('sortOrder');

    expect(field.type).toBe('string');
    expect(getOptions(field).layout).toBe('dropdown');
    expect(getOptionValues(field)).toEqual([
      TAXONOMY_SORT.ALPHABETICAL,
      TAXONOMY_SORT.MOST_POSTS,
    ]);
  });

  it('defaults to Alphabetical', () => {
    const field = getTaxonomyListField('sortOrder');

    expect(field.initialValue).toBe(TAXONOMY_SORT.ALPHABETICAL);
  });
});

describe('taxonomyListSchema limit field', () => {
  it('is a number field', () => {
    const field = getTaxonomyListField('limit');

    expect(field.type).toBe('number');
  });

  it('requires a positive integer when a value is provided', () => {
    const field = getTaxonomyListField('limit');

    if (!('validation' in field) || !field.validation) {
      throw new Error('Expected limit field to define validation.');
    }

    let integerCalled = false;
    let minValue: number | undefined;
    const rule: TValidationRule = {
      integer: () => {
        integerCalled = true;
        return rule;
      },
      min: (value) => {
        minValue = value;
        return rule;
      },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- exercising a real Sanity validation builder against a minimal mock Rule
    (field.validation as any)(rule);

    expect(integerCalled).toBe(true);
    expect(minValue).toBe(1);
  });
});

describe('taxonomyListSchema showLatestPosts field', () => {
  it('is a boolean field positioned immediately after limit', () => {
    const names = taxonomyListSchema.fields?.map((field) =>
      'name' in field ? field.name : undefined,
    );
    const limitIndex = names?.indexOf('limit');
    const showLatestPostsIndex = names?.indexOf('showLatestPosts');

    expect(showLatestPostsIndex).toBe((limitIndex ?? -1) + 1);

    const field = getTaxonomyListField('showLatestPosts');
    expect(field.type).toBe('boolean');
  });

  it('defaults to true', () => {
    const field = getTaxonomyListField('showLatestPosts');

    expect(field.initialValue).toBe(true);
  });

  it('defines no validation rule — it is optional so existing documents are not invalidated', () => {
    const field = getTaxonomyListField('showLatestPosts');

    expect(
      'validation' in field ? field.validation : undefined,
    ).toBeUndefined();
  });
});

describe('taxonomyListSchema headingBlock field', () => {
  it('is required at the field level', () => {
    const field = getTaxonomyListField('headingBlock');

    if (!('validation' in field) || !field.validation) {
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
