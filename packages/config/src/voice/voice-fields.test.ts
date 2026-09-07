import siteMessages from './site-messages.en.json';
import { VOICE_FIELDS } from './voice-fields';
import { VOICE_FIXED_KEYS } from './voice-fixed-keys';

function flattenKeys(value: unknown, prefix = ''): string[] {
  if (typeof value !== 'object' || value === null) return [];

  return Object.entries(value as Record<string, unknown>).flatMap(
    ([key, child]) => {
      const path = prefix ? `${prefix}.${key}` : key;

      return typeof child === 'object' && child !== null
        ? flattenKeys(child, path)
        : [path];
    },
  );
}

function getAtPath(value: unknown, path: string): unknown {
  return path
    .split('.')
    .reduce<unknown>(
      (node, segment) =>
        typeof node === 'object' && node !== null
          ? (node as Record<string, unknown>)[segment]
          : undefined,
      value,
    );
}

describe('VOICE_FIELDS / site-messages.en.json coverage', () => {
  const catalogKeys = flattenKeys(siteMessages);

  it.each(VOICE_FIELDS.map((field) => field.path))(
    'registry path %s resolves to a real catalog string',
    (path) => {
      expect(getAtPath(siteMessages, path)).toBeTypeOf('string');
    },
  );

  it('every catalog key is either registered or on VOICE_FIXED_KEYS', () => {
    const registeredPaths = new Set<string>(
      VOICE_FIELDS.map((field) => field.path),
    );
    const fixedPaths = new Set<string>(VOICE_FIXED_KEYS);

    const unaccounted = catalogKeys.filter(
      (key) => !registeredPaths.has(key) && !fixedPaths.has(key),
    );

    expect(unaccounted).toEqual([]);
  });

  it('VOICE_FIXED_KEYS carries no key already registered in VOICE_FIELDS', () => {
    const registeredPaths = new Set<string>(
      VOICE_FIELDS.map((field) => field.path),
    );

    const overlap = VOICE_FIXED_KEYS.filter((key) => registeredPaths.has(key));

    expect(overlap).toEqual([]);
  });

  it('VOICE_FIXED_KEYS carries no stale entry absent from the catalog', () => {
    const catalogKeySet = new Set(catalogKeys);

    const stale = VOICE_FIXED_KEYS.filter((key) => !catalogKeySet.has(key));

    expect(stale).toEqual([]);
  });

  it('every field id is unique', () => {
    const ids = VOICE_FIELDS.map((field) => field.id);

    expect(new Set(ids).size).toBe(ids.length);
  });
});
