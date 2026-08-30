import { defineModulesField } from '@blog/studio/schema-types/helpers/define-modules-field';
import type { ArrayRule } from 'sanity';

type TCallLog = { method: string; args: unknown[] }[];

type TMockRule = {
  readonly path: string;
  unique: () => TMockRule;
  error: (message: string) => TMockRule;
  custom: (fn: (...args: never[]) => unknown) => TMockRule;
};

const createMockRule = (callLog: TCallLog, path = 'rule'): TMockRule => ({
  path,
  unique: () => {
    callLog.push({ method: 'unique', args: [] });
    return createMockRule(callLog, `${path}.unique()`);
  },
  error: (message) => {
    callLog.push({ method: 'error', args: [message] });
    return createMockRule(callLog, `${path}.error()`);
  },
  custom: (fn) => {
    callLog.push({ method: 'custom', args: [fn] });
    return createMockRule(callLog, `${path}.custom()`);
  },
});

/**
 * `defineModulesField`'s `validation` builder is
 * `(rule) => validateCustom ? validateCustom(uniqueRule) : uniqueRule` —
 * invoking it against a minimal chainable mock rule (each call returns a
 * fresh, path-tagged instance) makes both the call sequence and the exact
 * rule instance handed to `validateCustom` observable without a real Sanity
 * Rule.
 */
const runFieldValidation = (
  field: ReturnType<typeof defineModulesField>,
  callLog: TCallLog,
): TMockRule => {
  if (!field.validation) {
    throw new Error('Expected defineModulesField to define validation.');
  }

  const baseRule = createMockRule(callLog);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- exercising a real Sanity validation builder against a minimal mock Rule
  return (field.validation as any)(baseRule) as TMockRule;
};

describe('defineModulesField validation', () => {
  it('always chains unique().error(...) with the shared duplicate-reference message', () => {
    const callLog: TCallLog = [];
    const field = defineModulesField({ allow: ['module_cta'] });

    runFieldValidation(field, callLog);

    expect(callLog[0]).toEqual({ method: 'unique', args: [] });
    expect(callLog[1]).toEqual({
      method: 'error',
      args: ['Each module can only be referenced once per page.'],
    });
  });

  describe('when validateCustom is omitted', () => {
    it('returns the unique().error() rule unchanged, with no further calls', () => {
      const callLog: TCallLog = [];
      const field = defineModulesField({ allow: ['module_cta'] });

      const result = runFieldValidation(field, callLog);

      expect(callLog).toHaveLength(2);
      expect(result.path).toBe('rule.unique().error()');
    });
  });

  describe('when validateCustom is supplied', () => {
    it('receives the rule after unique().error(), and its return value becomes the final rule', () => {
      const callLog: TCallLog = [];
      let receivedRulePath: string | undefined;

      const field = defineModulesField({
        allow: ['module_postLatest'],
        validateCustom: (rule) => {
          receivedRulePath = (rule as unknown as TMockRule).path;
          const next = (rule as unknown as TMockRule).custom(() => true);
          return next as unknown as ArrayRule<unknown[]>;
        },
      });

      const result = runFieldValidation(field, callLog);

      expect(receivedRulePath).toBe('rule.unique().error()');
      expect(callLog.map((call) => call.method)).toEqual([
        'unique',
        'error',
        'custom',
      ]);
      expect(result.path).toBe('rule.unique().error().custom()');
    });
  });
});
