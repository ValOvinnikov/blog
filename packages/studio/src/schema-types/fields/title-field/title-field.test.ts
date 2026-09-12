import { titleField } from '@blog/studio/schema-types/fields/title-field/title-field';

type TCallLog = { method: string; args: unknown[] }[];

type TMockRule = {
  readonly path: string;
  required: () => TMockRule;
};

const createMockRule = (callLog: TCallLog, path = 'rule'): TMockRule => ({
  path,
  required: () => {
    callLog.push({ method: 'required', args: [] });
    return createMockRule(callLog, `${path}.required()`);
  },
});

const runFieldValidation = (
  field: ReturnType<typeof titleField>,
  callLog: TCallLog,
): TMockRule => {
  if (!field.validation) {
    throw new Error('Expected titleField to define validation.');
  }

  const baseRule = createMockRule(callLog);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- exercising a real Sanity validation builder against a minimal mock Rule
  return (field.validation as any)(baseRule) as TMockRule;
};

describe('titleField', () => {
  it('is named title, labeled Title, and required', () => {
    const field = titleField();

    expect(field.name).toBe('title');
    expect(field.title).toBe('Title');
    expect(field.type).toBe('string');

    const callLog: TCallLog = [];
    const result = runFieldValidation(field, callLog);

    expect(callLog).toEqual([{ method: 'required', args: [] }]);
    expect(result.path).toBe('rule.required()');
  });

  it('defaults to the internal-use-only description when no slug is generated', () => {
    const field = titleField();

    expect(field.description).toBe(
      'Give this document a clear, descriptive title to help identify it in Studio. This title for internal use only',
    );
  });

  it('describes seeding the slug when generatesSlug is true', () => {
    const field = titleField({ generatesSlug: true });

    expect(field.description).toBe(
      'Give this document a clear, descriptive title to help identify it in Studio. This title also is used to automatically generate the slug. This title for internal use only',
    );
  });

  it('lets a caller-supplied description override the default, with generatesSlug true', () => {
    const field = titleField({
      generatesSlug: true,
      description: 'Internal label shown in the Studio.',
    });

    expect(field.description).toBe('Internal label shown in the Studio.');
  });

  it('lets a caller-supplied description override the default, with generatesSlug omitted', () => {
    const field = titleField({
      description: 'Internal label shown in the Studio.',
    });

    expect(field.description).toBe('Internal label shown in the Studio.');
  });
});
