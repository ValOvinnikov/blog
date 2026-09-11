import { postRelatedSchema } from '@blog/studio/schema-types/modules/module-post-related';

const getField = (name: string) => {
  const field = postRelatedSchema.fields?.find(
    (field): field is typeof field & { name: string } =>
      'name' in field && field.name === name,
  );

  if (!field) {
    throw new Error(`Expected postRelatedSchema to define a "${name}" field.`);
  }

  return field;
};

type TRule = {
  required: () => TRule;
  integer: () => TRule;
  min: (value: number) => TRule;
  max: (value: number) => TRule;
};

const createTrackingRule = () => {
  const calls = {
    required: false,
    integer: false,
    min: undefined as number | undefined,
    max: undefined as number | undefined,
  };

  const rule: TRule = {
    required: () => {
      calls.required = true;
      return rule;
    },
    integer: () => {
      calls.integer = true;
      return rule;
    },
    min: (value) => {
      calls.min = value;
      return rule;
    },
    max: (value) => {
      calls.max = value;
      return rule;
    },
  };

  return { rule, calls };
};

describe('postRelatedSchema shape', () => {
  it('defines the expected fields', () => {
    const names = postRelatedSchema.fields?.map((field) => field.name);

    expect(names).toEqual(
      expect.arrayContaining([
        'title',
        'brandVariant',
        'headingBlock',
        'showImages',
        'limit',
        'contentAlignment',
        'layout',
      ]),
    );
  });

  it('has no displayMode field', () => {
    expect(
      postRelatedSchema.fields?.some((field) => field.name === 'displayMode'),
    ).toBe(false);
  });
});

describe('postRelatedSchema headingBlock field', () => {
  it('blocks publish on an empty heading', () => {
    const field = getField('headingBlock');

    if (typeof field.validation !== 'function') {
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
    expect(customFn({ heading: 'Related reading' })).toBe(true);
  });
});

describe('postRelatedSchema limit field', () => {
  it('defaults to 3', () => {
    expect(getField('limit').initialValue).toBe(3);
  });

  it('requires an integer between 1 and 6', () => {
    const field = getField('limit');

    if (typeof field.validation !== 'function') {
      throw new Error('Expected limit field to define validation.');
    }

    const { rule, calls } = createTrackingRule();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- exercising a real Sanity validation builder against a minimal mock Rule
    (field.validation as any)(rule);

    expect(calls.required).toBe(true);
    expect(calls.integer).toBe(true);
    expect(calls.min).toBe(1);
    expect(calls.max).toBe(6);
  });
});

describe('postRelatedSchema preview', () => {
  it('shows the limit as the subtitle', () => {
    const prepare = postRelatedSchema.preview?.prepare;

    if (!prepare) {
      throw new Error('Expected postRelatedSchema to define preview.prepare.');
    }

    expect(prepare({ title: 'Related reading', limit: 3 })).toEqual({
      title: 'Related reading',
      subtitle: 'Limit: 3',
    });
  });

  it('falls back to "Unknown" when title is empty', () => {
    const prepare = postRelatedSchema.preview?.prepare;

    if (!prepare) {
      throw new Error('Expected postRelatedSchema to define preview.prepare.');
    }

    expect(prepare({ title: undefined, limit: undefined })).toEqual({
      title: 'Unknown',
      subtitle: undefined,
    });
  });
});
