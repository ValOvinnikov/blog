import { GITHUB_FILE_STATUS } from '@platform/constants/github';
import { mockChangedFile } from '@platform/testing/github/fixtures';

import {
  countAddedContentMigrations,
  countPendingDbMigrations,
  listAddedDbMigrationTags,
} from './added-migrations';

const added = (filename: string) =>
  mockChangedFile(filename, GITHUB_FILE_STATUS.ADDED);

describe(countAddedContentMigrations, () => {
  it('counts each content migration folder added', () => {
    const count = countAddedContentMigrations([
      added('packages/studio/migrations/20261001T0900-add-thing/index.ts'),
      added('packages/studio/migrations/20261001T0900-add-thing/transform.ts'),
      added('packages/studio/migrations/20261002T1000-move-thing/index.ts'),
    ]);

    expect(count).toBe(2);
  });

  it('ignores an edited existing migration and the shared helpers', () => {
    const count = countAddedContentMigrations([
      mockChangedFile(
        'packages/studio/migrations/20260716T1108-rename/index.ts',
      ),
      added('packages/studio/migrations/lib/index.ts'),
      added('packages/studio/migrations/README.md'),
    ]);

    expect(count).toBe(0);
  });
});

describe(listAddedDbMigrationTags, () => {
  it('lists the tag of each added migration file, not the snapshots', () => {
    const tags = listAddedDbMigrationTags([
      added('packages/db/migrations/0042_add_things.sql'),
      added('packages/db/migrations/meta/0042_snapshot.json'),
      mockChangedFile('packages/db/migrations/0041_old.sql'),
    ]);

    expect(tags).toEqual(['0042_add_things']);
  });
});

describe(countPendingDbMigrations, () => {
  const journal = [
    { tag: '0042_add_things', when: 1000 },
    { tag: '0043_more_things', when: 2000 },
  ];

  it('counts the added migrations the applied journal does not hold', () => {
    const count = countPendingDbMigrations(
      ['0042_add_things', '0043_more_things'],
      journal,
      [1000],
    );

    expect(count).toBe(1);
  });

  it('is zero when every added migration is already applied', () => {
    const count = countPendingDbMigrations(
      ['0042_add_things'],
      journal,
      [1000, 2000],
    );

    expect(count).toBe(0);
  });
});
