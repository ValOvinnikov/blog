import { slugField } from '@blog/studio/schema-types/helpers/slug-field';

type TCallLog = { method: string; args: unknown[] }[];

type TMockRule = {
  readonly path: string;
  required: () => TMockRule;
  custom: (fn: (...args: never[]) => unknown) => TMockRule;
};

const createMockRule = (callLog: TCallLog, path = 'rule'): TMockRule => ({
  path,
  required: () => {
    callLog.push({ method: 'required', args: [] });
    return createMockRule(callLog, `${path}.required()`);
  },
  custom: (fn) => {
    callLog.push({ method: 'custom', args: [fn] });
    return createMockRule(callLog, `${path}.custom()`);
  },
});

const runFieldValidation = (
  field: ReturnType<typeof slugField>,
  callLog: TCallLog,
): TMockRule => {
  if (!field.validation) {
    throw new Error('Expected slugField to define validation.');
  }

  const baseRule = createMockRule(callLog);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- exercising a real Sanity validation builder against a minimal mock Rule
  return (field.validation as any)(baseRule) as TMockRule;
};

describe('slugField', () => {
  it('builds a slug field sourced from title, capped at 96 characters', () => {
    const field = slugField({ description: 'A slug.' });

    expect(field.name).toBe('slug');
    expect(field.title).toBe('Slug');
    expect(field.type).toBe('slug');
    expect(field.description).toBe('A slug.');
    expect(field.options).toEqual({ source: 'title', maxLength: 96 });
  });

  it('omits components when no previewInput is given', () => {
    const field = slugField({ description: 'A slug.' });

    expect(field.components).toBeUndefined();
  });

  it('wires previewInput into components.input when given', () => {
    const previewInput = () => null;

    const field = slugField({ description: 'A slug.', previewInput });

    expect(field.components).toEqual({ input: previewInput });
  });

  describe('when validateSlug is omitted', () => {
    it('is required, with no further validation calls', () => {
      const callLog: TCallLog = [];
      const field = slugField({ description: 'A slug.' });

      const result = runFieldValidation(field, callLog);

      expect(callLog).toEqual([{ method: 'required', args: [] }]);
      expect(result.path).toBe('rule.required()');
    });
  });

  describe('when validateSlug is supplied', () => {
    it('chains it after required(), unchanged', () => {
      const callLog: TCallLog = [];
      const validateSlug = () => true as const;

      const field = slugField({ description: 'A slug.', validateSlug });

      const result = runFieldValidation(field, callLog);

      expect(callLog).toEqual([
        { method: 'required', args: [] },
        { method: 'custom', args: [validateSlug] },
      ]);
      expect(result.path).toBe('rule.required().custom()');
    });
  });
});
