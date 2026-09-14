import { linksField } from '@blog/studio/schema-types/fields/links-field/links-field';
import { linkRefSchema } from '@blog/studio/schema-types/objects/link-ref/link-ref';
import { getCustomValidator } from '@blog/studio/testing/create-mock-validation-rule';

type TCallLog = { method: string; args: unknown[] }[];

type TMockRule = {
  readonly path: string;
  min: (value: number) => TMockRule;
  max: (value: number) => TMockRule;
  custom: (fn: (...args: never[]) => unknown) => TMockRule;
};

const createMockRule = (callLog: TCallLog, path = 'rule'): TMockRule => ({
  path,
  min: (value) => {
    callLog.push({ method: 'min', args: [value] });
    return createMockRule(callLog, `${path}.min()`);
  },
  max: (value) => {
    callLog.push({ method: 'max', args: [value] });
    return createMockRule(callLog, `${path}.max()`);
  },
  custom: (fn) => {
    callLog.push({ method: 'custom', args: [fn] });
    return createMockRule(callLog, `${path}.custom()`);
  },
});

const runFieldValidation = (
  field: ReturnType<typeof linksField>,
  callLog: TCallLog,
): TMockRule => {
  if (!field.validation) {
    throw new Error('Expected linksField to define validation.');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- exercising a real Sanity validation builder against a minimal mock Rule
  return (field.validation as any)(createMockRule(callLog)) as TMockRule;
};

describe('linksField', () => {
  it('defaults `of` to linkRef', () => {
    const field = linksField({ name: 'links', title: 'Links' });

    expect(field.of).toEqual([{ type: linkRefSchema.name }]);
  });

  it('uses the provided `of` member types instead of the default', () => {
    const field = linksField({
      name: 'links',
      title: 'Links',
      of: ['ctaActionRef'],
    });

    expect(field.of).toEqual([{ type: 'ctaActionRef' }]);
  });

  it('chains min() and max() before the duplicate-guard custom(), only when given', () => {
    const callLog: TCallLog = [];
    const field = linksField({
      name: 'secondaryLink',
      title: 'Secondary Link',
      max: 1,
    });

    runFieldValidation(field, callLog);

    expect(callLog.map((call) => call.method)).toEqual(['max', 'custom']);
    expect(callLog[0]).toEqual({ method: 'max', args: [1] });
  });

  it('chains no bounds when min/max are omitted', () => {
    const callLog: TCallLog = [];
    const field = linksField({ name: 'links', title: 'Links' });

    runFieldValidation(field, callLog);

    expect(callLog.map((call) => call.method)).toEqual(['custom']);
  });
});

describe('linksField duplicate-shared-link guard', () => {
  const getValidator = () => {
    type TValidatorFn = (value: unknown) => string | true;

    const field = linksField({ name: 'links', title: 'Links' });

    return getCustomValidator<TValidatorFn>(field);
  };

  it('passes an empty array', () => {
    expect(getValidator()([])).toBe(true);
  });

  it('passes items referencing different shared links', () => {
    const value = [
      { link: { _ref: 'shared_link-a' } },
      { link: { _ref: 'shared_link-b' } },
    ];

    expect(getValidator()(value)).toBe(true);
  });

  it('rejects the same shared link referenced twice', () => {
    const value = [
      { link: { _ref: 'shared_link-a' } },
      { link: { _ref: 'shared_link-a' } },
    ];

    expect(getValidator()(value)).toBe(
      'Each shared link can only be referenced once in this list.',
    );
  });

  it('ignores items with no link reference yet', () => {
    const value = [{}, { link: {} }];

    expect(getValidator()(value)).toBe(true);
  });
});
