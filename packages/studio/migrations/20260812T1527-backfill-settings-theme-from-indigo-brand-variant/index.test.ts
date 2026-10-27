import {
  MOCK_SYSTEM_FIELDS,
  mockMigrationContext,
} from '@blog/studio/testing/mock-migration';
import { at, createIfNotExists, patch, set } from 'sanity/migrate';

import {
  INDIGO_THEME_TARGET,
  THEME_DOCUMENT_ID,
  THEME_DOCUMENT_TYPE,
} from './transform';

import migration from './index';

const INDIGO_SITE = { brand: { variant: 'INDIGO' } };
const CONSOLE_SITE = { brand: { variant: 'CONSOLE' } };

const INDIGO_MUTATIONS = [
  createIfNotExists({
    _id: THEME_DOCUMENT_ID,
    _type: THEME_DOCUMENT_TYPE,
    ...INDIGO_THEME_TARGET,
  }),
  patch(THEME_DOCUMENT_ID, [
    at('preset', set(INDIGO_THEME_TARGET.preset)),
    at('accentHue', set(INDIGO_THEME_TARGET.accentHue)),
    at('logoHue', set(INDIGO_THEME_TARGET.logoHue)),
  ]),
];

describe('settings_theme backfill migration', () => {
  it('creates the theme for an INDIGO site when none exists', async () => {
    const getDocument = vi.fn().mockResolvedValue(undefined);

    const result = await migration.migrate.document?.(
      // @ts-expect-error -- only the fields the transform reads are needed
      INDIGO_SITE,
      mockMigrationContext({ getDocument }),
    );

    expect(result).toEqual(INDIGO_MUTATIONS);
  });

  it('does nothing for a non-INDIGO site and skips the theme lookup', async () => {
    const getDocument = vi.fn();

    const result = await migration.migrate.document?.(
      // @ts-expect-error -- only the fields the transform reads are needed
      CONSOLE_SITE,
      mockMigrationContext({ getDocument }),
    );

    expect(result).toEqual([]);
    expect(getDocument).not.toHaveBeenCalled();
  });

  it('does nothing when the theme already matches the target', async () => {
    const getDocument = vi.fn().mockResolvedValue({
      ...MOCK_SYSTEM_FIELDS,
      _id: THEME_DOCUMENT_ID,
      _type: THEME_DOCUMENT_TYPE,
      ...INDIGO_THEME_TARGET,
    });

    const result = await migration.migrate.document?.(
      // @ts-expect-error -- only the fields the transform reads are needed
      INDIGO_SITE,
      mockMigrationContext({ getDocument }),
    );

    expect(result).toEqual([]);
  });
});
