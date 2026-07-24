import { notFound } from 'next/navigation';

import '@testing-library/jest-dom/vitest';

import messages from './i18n/messages/en.json';

// Placeholder values for the validated env module (`@/utils/env/env`) so
// components/routes that read it can render under Vitest without requiring
// a real `.env` file. Tests never hit the network, so these values only need
// to satisfy the Zod schema shape.
process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ??= 'test-project';
process.env.NEXT_PUBLIC_SANITY_DATASET ??= 'test-dataset';
process.env.NEXT_PUBLIC_SITE_URL ??= 'https://example.com';

type TTranslationValues = Record<string, string | number>;
type TGetTranslationsArg = string | { namespace?: string } | undefined;

const toNamespace = (arg: TGetTranslationsArg): string | undefined =>
  typeof arg === 'string' ? arg : arg?.namespace;

const resolveNamespace = (namespace?: string): Record<string, string> => {
  const scope: unknown = namespace
    ? namespace
        .split('.')
        .reduce<unknown>(
          (acc, key) =>
            typeof acc === 'object' && acc !== null
              ? (acc as Record<string, unknown>)[key]
              : undefined,
          messages,
        )
    : messages;

  if (typeof scope !== 'object' || scope === null) {
    throw new Error(
      `getTranslations mock: no messages found for namespace "${namespace}" in i18n/messages/en.json`,
    );
  }

  return scope as Record<string, string>;
};

// Only supports flat `{param}` interpolation, not full ICU (plurals/select/
// rich text) — extend here if a future message needs that.
const interpolate = (template: string, values?: TTranslationValues): string =>
  values
    ? Object.entries(values).reduce(
        (acc, [key, value]) => acc.replaceAll(`{${key}}`, String(value)),
        template,
      )
    : template;

// `next-intl/server`'s `setRequestLocale` is called by every locale-aware
// layout/page but never asserted on — stub it globally so individual test
// files don't repeat the mock. `getTranslations` is stubbed as a minimal
// stand-in that resolves real strings from `i18n/messages/en.json` (so a
// test catches a missing/renamed key) and performs `{param}` interpolation —
// component tests then assert on the actual rendered copy instead of a fake.
// `getFormatter` is stubbed the same way for `dateTime`: it delegates to the
// real `Intl.DateTimeFormat` (via `toLocaleDateString`) under the `en` locale
// that `i18n/messages/en.json` represents, so tests assert the real rendered
// date string instead of a fake.
vi.mock('next-intl/server', () => ({
  setRequestLocale: vi.fn(),
  getTranslations: vi.fn(async (arg?: TGetTranslationsArg) => {
    const scoped = resolveNamespace(toNamespace(arg));
    return (key: string, values?: TTranslationValues) => {
      const template = scoped[key];
      if (template === undefined) {
        throw new Error(
          `getTranslations mock: no message for key "${key}" in namespace "${toNamespace(arg)}"`,
        );
      }
      return interpolate(template, values);
    };
  }),
  getFormatter: vi.fn(async () => ({
    dateTime: (date: Date, options?: Intl.DateTimeFormatOptions) =>
      date.toLocaleDateString('en', options),
  })),
}));

// `next/navigation`'s `notFound()` must keep throwing so components short-
// circuit exactly as it does at runtime (Next renders the not-found boundary
// via a thrown NEXT_NOT_FOUND digest). Tests that assert on it import the
// binding directly: `import { notFound } from 'next/navigation';` then
// `expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1)`. Cleared before each
// test so call counts never leak across `it`s.
vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));

beforeEach(() => {
  vi.mocked(notFound).mockClear();
});
