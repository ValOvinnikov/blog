import type { TModulePack } from '@blog/config/constants';
import type { TMaybeUndefined } from '@blog/config/types';
import { getMissingModulePack } from '@blog/studio/schema-types/inputs/requirement-warning-input/missing-requirement/get-missing-requirement';
import { getModuleTitle } from '@blog/studio/structure/module-kinds/module-kinds';
import { hasArrayGotItems, isNull } from '@blog/utils/primitives';

type TPickerType = { name: string };

type TPickerGroup = { name: string; title?: string; of?: string[] };

type TModulePickerSection<T extends TPickerType> = {
  name: string;
  title: TMaybeUndefined<string>;
  types: T[];
};

const UNGROUPED_SECTION = 'ungrouped';

export const getOffPlanModulePack = (
  types: readonly TPickerType[],
  entitledModulePacks: readonly TModulePack[],
): TMaybeUndefined<TModulePack> =>
  types
    .map(({ name }) => getMissingModulePack(name, entitledModulePacks))
    .find((modulePack) => !isNull(modulePack)) ?? undefined;

export const getModulePickerSections = <T extends TPickerType>({
  types,
  groups = [],
  query,
}: {
  types: readonly T[];
  groups?: readonly TPickerGroup[];
  query: string;
}): TModulePickerSection<T>[] => {
  const needle = query.trim().toLowerCase();
  const matching = types.filter(({ name }) =>
    getModuleTitle(name).toLowerCase().includes(needle),
  );
  const grouped = new Set(groups.flatMap((group) => group.of ?? []));

  return [
    ...groups.map((group) => ({
      name: group.name,
      title: group.title ?? group.name,
      types: matching.filter(({ name }) => group.of?.includes(name)),
    })),
    {
      name: UNGROUPED_SECTION,
      title: undefined,
      types: matching.filter(({ name }) => !grouped.has(name)),
    },
  ].filter(({ types: sectionTypes }) => hasArrayGotItems(sectionTypes));
};
