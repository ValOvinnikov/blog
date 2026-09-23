import { modulesField } from '@blog/studio/schema-types/fields/modules-field/modules-field';

type TCallLog = { method: string; args: unknown[] }[];
type TModuleReference = { _type?: string; _key?: string };
type TViolation = { message: string; path: unknown[] };
type TOnceCustomFn = (
  modules: TModuleReference[] | undefined,
) => TViolation[] | true;

type TMockRule = {
  unique: () => TMockRule;
  error: (message: string) => TMockRule;
  custom: (fn: TOnceCustomFn) => TMockRule;
};

const createMockRule = (
  callLog: TCallLog,
  customFns: TOnceCustomFn[],
): TMockRule => ({
  unique: () => {
    callLog.push({ method: 'unique', args: [] });
    return createMockRule(callLog, customFns);
  },
  error: (message) => {
    callLog.push({ method: 'error', args: [message] });
    return createMockRule(callLog, customFns);
  },
  custom: (fn) => {
    callLog.push({ method: 'custom', args: [fn] });
    customFns.push(fn);
    return createMockRule(callLog, customFns);
  },
});

const runFieldValidation = (
  field: ReturnType<typeof modulesField>,
  customFns: TOnceCustomFn[] = [],
): TCallLog => {
  if (!field.validation) {
    throw new Error('Expected modulesField to define validation.');
  }

  const callLog: TCallLog = [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- exercising a real Sanity validation builder against a minimal mock Rule
  (field.validation as any)(createMockRule(callLog, customFns));

  return callLog;
};

describe('modulesField validation', () => {
  it('always chains unique().error(...) with the shared duplicate-reference message', () => {
    const field = modulesField({ allow: ['module_cta'] });

    const callLog = runFieldValidation(field);

    expect(callLog[0]).toEqual({ method: 'unique', args: [] });
    expect(callLog[1]).toEqual({
      method: 'error',
      args: ['Each module can only be referenced once per page.'],
    });
  });

  describe('when once is omitted', () => {
    it('attaches no custom rule beyond unique().error()', () => {
      const field = modulesField({ allow: ['module_cta'] });

      const callLog = runFieldValidation(field);

      expect(callLog).toHaveLength(2);
    });
  });

  describe('when once is supplied', () => {
    const buildOnceCustomFn = (): TOnceCustomFn => {
      const customFns: TOnceCustomFn[] = [];
      const field = modulesField({
        allow: ['module_postList', 'module_cta'],
        once: ['module_postList'],
      });

      runFieldValidation(field, customFns);

      const [customFn] = customFns;

      if (!customFn) {
        throw new Error('Expected modulesField to register a custom() rule.');
      }

      return customFn;
    };

    it('errors on a second module of a listed type, marking each offending item by _key', () => {
      const customFn = buildOnceCustomFn();

      const result = customFn([
        { _type: 'module_postList', _key: 'a' },
        { _type: 'module_postList', _key: 'b' },
      ]);

      expect(result).toEqual([
        {
          message: 'Only one module of this type is allowed per page.',
          path: [{ _key: 'a' }],
        },
        {
          message: 'Only one module of this type is allowed per page.',
          path: [{ _key: 'b' }],
        },
      ]);
    });

    it('falls back to the item index when _key is absent', () => {
      const customFn = buildOnceCustomFn();

      const result = customFn([
        { _type: 'module_postList' },
        { _type: 'module_postList' },
      ]);

      expect(result).toEqual([
        {
          message: 'Only one module of this type is allowed per page.',
          path: [0],
        },
        {
          message: 'Only one module of this type is allowed per page.',
          path: [1],
        },
      ]);
    });

    it('accepts a second module of a type not listed in once', () => {
      const customFn = buildOnceCustomFn();

      const result = customFn([
        { _type: 'module_cta', _key: 'a' },
        { _type: 'module_cta', _key: 'b' },
      ]);

      expect(result).toBe(true);
    });
  });
});
