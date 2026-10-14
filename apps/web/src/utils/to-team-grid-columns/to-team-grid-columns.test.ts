import { toTeamGridColumns } from './to-team-grid-columns';

describe(toTeamGridColumns, () => {
  it.each([4, 7, 8, 10])(
    'lays out %i members in 4 columns when bios are hidden',
    (memberCount) => {
      expect(toTeamGridColumns(memberCount, false)).toBe(4);
    },
  );

  it.each([4, 7, 8, 10])(
    'caps %i members at 3 columns when bios are shown',
    (memberCount) => {
      expect(toTeamGridColumns(memberCount, true)).toBe(3);
    },
  );

  it.each([
    [2, 2],
    [3, 3],
    [5, 3],
  ])(
    'keeps %i members in %i columns whether or not bios are shown',
    (memberCount, expectedColumns) => {
      expect(toTeamGridColumns(memberCount, false)).toBe(expectedColumns);
      expect(toTeamGridColumns(memberCount, true)).toBe(expectedColumns);
    },
  );
});
