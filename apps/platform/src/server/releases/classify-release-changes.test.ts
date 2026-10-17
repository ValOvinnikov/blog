import { classifyReleaseChanges } from './classify-release-changes';

const modified = (filename: string) => ({ filename, status: 'modified' });

describe(classifyReleaseChanges, () => {
  it('reports no change for a docs-only file list', () => {
    expect(
      classifyReleaseChanges([modified('docs/features/README.md')], false),
    ).toEqual({
      RENDERING: false,
      DB_MIGRATION: false,
      SANITY_MIGRATION: false,
      ENV: false,
    });
  });

  it('reports each set a file list touches', () => {
    expect(
      classifyReleaseChanges(
        [
          modified('packages/ui/src/atoms/button/button.tsx'),
          modified('packages/db/migrations/0042_add_things.sql'),
          modified('apps/platform/.env.example'),
        ],
        false,
      ),
    ).toEqual({
      RENDERING: true,
      DB_MIGRATION: true,
      SANITY_MIGRATION: false,
      ENV: true,
    });
  });

  it('reports every set as changed when the file list was truncated', () => {
    expect(classifyReleaseChanges([modified('docs/README.md')], true)).toEqual({
      RENDERING: true,
      DB_MIGRATION: true,
      SANITY_MIGRATION: true,
      ENV: true,
    });
  });
});
