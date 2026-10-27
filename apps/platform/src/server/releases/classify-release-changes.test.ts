import { RELEASE_CHANGE } from '@blog/config';
import { mockChangedFile } from '@platform/testing/github/fixtures';

import { classifyReleaseChanges } from './classify-release-changes';

describe(classifyReleaseChanges, () => {
  it('reports no change for a docs-only file list', () => {
    const changes = classifyReleaseChanges(
      [mockChangedFile('docs/features/README.md')],
      false,
    );

    expect(changes).toEqual({
      [RELEASE_CHANGE.RENDERING]: false,
      [RELEASE_CHANGE.DB_MIGRATION]: false,
      [RELEASE_CHANGE.SANITY_MIGRATION]: false,
      [RELEASE_CHANGE.ENV]: false,
    });
  });

  it('reports each set a file list touches', () => {
    const changes = classifyReleaseChanges(
      [
        mockChangedFile('packages/ui/src/atoms/button/button.tsx'),
        mockChangedFile('packages/db/migrations/0042_add_things.sql'),
        mockChangedFile('apps/platform/.env.example'),
      ],
      false,
    );

    expect(changes).toEqual({
      [RELEASE_CHANGE.RENDERING]: true,
      [RELEASE_CHANGE.DB_MIGRATION]: true,
      [RELEASE_CHANGE.SANITY_MIGRATION]: false,
      [RELEASE_CHANGE.ENV]: true,
    });
  });

  it('reports every set as changed when the file list was truncated', () => {
    const changes = classifyReleaseChanges(
      [mockChangedFile('docs/README.md')],
      true,
    );

    expect(changes).toEqual({
      [RELEASE_CHANGE.RENDERING]: true,
      [RELEASE_CHANGE.DB_MIGRATION]: true,
      [RELEASE_CHANGE.SANITY_MIGRATION]: true,
      [RELEASE_CHANGE.ENV]: true,
    });
  });
});
