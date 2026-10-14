import { toModuleGridColumns } from '@web/utils/to-module-grid-columns';

export const toTeamGridColumns = (
  memberCount: number,
  showBios: boolean,
): ReturnType<typeof toModuleGridColumns> => {
  const columns = toModuleGridColumns(memberCount);

  return showBios && columns === 4 ? 3 : columns;
};
