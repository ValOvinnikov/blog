import { toModuleGridColumns } from '@web/utils/to-module-grid-columns';

import { toTeamGridColumns } from './to-team-grid-columns';

const FOUR_COLUMN_COUNTS = [4, 7, 8, 10];
const NARROWER_COUNTS = [2, 3, 5];

describe(toTeamGridColumns, () => {
  it.each(FOUR_COLUMN_COUNTS)(
    'lays out %i members in 4 columns when bios are hidden',
    (memberCount) => {
      expect(toTeamGridColumns(memberCount, false)).toBe(4);
    },
  );

  it.each(FOUR_COLUMN_COUNTS)(
    'caps %i members at 3 columns when bios are shown',
    (memberCount) => {
      expect(toTeamGridColumns(memberCount, true)).toBe(3);
    },
  );

  it.each(NARROWER_COUNTS)(
    'keeps the module layout for %i members whether or not bios are shown',
    (memberCount) => {
      const moduleColumns = toModuleGridColumns(memberCount);

      expect(toTeamGridColumns(memberCount, false)).toBe(moduleColumns);
      expect(toTeamGridColumns(memberCount, true)).toBe(moduleColumns);
    },
  );
});
