import type { ValidationContext } from 'sanity';

export type TModuleReference = { _type?: string; _ref?: string };

export type TModulesCustomFn = (
  modules: TModuleReference[] | undefined,
  context: ValidationContext,
) => Promise<string | true>;

export type TMockModulesRule = {
  unique: () => TMockModulesRule;
  error: (message: string) => TMockModulesRule;
  custom: (fn: TModulesCustomFn) => TMockModulesRule;
};

/**
 * `unique()`/`error()`/`custom()` each return a fresh mock rule wrapping the
 * same shared `customFns` array, mirroring the real Sanity `Rule` chain
 * (`rule.custom(a).custom(b)`) closely enough to observe whether both
 * `.custom()` calls actually register, rather than the second silently
 * displacing the first.
 */
export const createMockModulesRule = (
  customFns: TModulesCustomFn[],
): TMockModulesRule => ({
  unique: () => createMockModulesRule(customFns),
  error: () => createMockModulesRule(customFns),
  custom: (fn) => {
    customFns.push(fn);
    return createMockModulesRule(customFns);
  },
});
