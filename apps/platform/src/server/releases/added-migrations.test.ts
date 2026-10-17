import {
  countAddedContentMigrations,
  countPendingDbMigrations,
  listAddedDbMigrationTags,
} from './added-migrations';

const file = (filename: string, status = 'added') => ({ filename, status });

describe(countAddedContentMigrations, () => {
  it('counts each content migration folder added', () => {
    expect(
      countAddedContentMigrations([
        file('packages/studio/migrations/20261001T0900-add-thing/index.ts'),
        file('packages/studio/migrations/20261001T0900-add-thing/transform.ts'),
        file('packages/studio/migrations/20261002T1000-move-thing/index.ts'),
      ]),
    ).toBe(2);
  });

  it('ignores an existing migration that was edited and the shared helpers', () => {
    expect(
      countAddedContentMigrations([
        file(
          'packages/studio/migrations/20260716T1108-rename/index.ts',
          'modified',
        ),
        file('packages/studio/migrations/lib/index.ts'),
        file('packages/studio/migrations/README.md'),
      ]),
    ).toBe(0);
  });
});

describe(listAddedDbMigrationTags, () => {
  it('lists the tag of each added migration file, not the snapshots', () => {
    expect(
      listAddedDbMigrationTags([
        file('packages/db/migrations/0042_add_things.sql'),
        file('packages/db/migrations/meta/0042_snapshot.json'),
        file('packages/db/migrations/0041_old.sql', 'modified'),
      ]),
    ).toEqual(['0042_add_things']);
  });
});

describe(countPendingDbMigrations, () => {
  const journal = [
    { tag: '0042_add_things', when: 1000 },
    { tag: '0043_more_things', when: 2000 },
  ];

  it('counts the added migrations the applied journal does not hold', () => {
    expect(
      countPendingDbMigrations(
        ['0042_add_things', '0043_more_things'],
        journal,
        [1000],
      ),
    ).toBe(1);
  });

  it('is zero when every added migration is already applied', () => {
    expect(
      countPendingDbMigrations(['0042_add_things'], journal, [1000, 2000]),
    ).toBe(0);
  });
});
