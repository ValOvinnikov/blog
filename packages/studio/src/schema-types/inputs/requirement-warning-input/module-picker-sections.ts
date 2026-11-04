import type { TModulePack } from '@blog/config/constants';
import type { TMaybeUndefined } from '@blog/config/types';
import { getMissingModulePack } from '@blog/studio/schema-types/inputs/requirement-warning-input/get-missing-requirement';
import { getModuleTitle } from '@blog/studio/structure/module-kinds/module-kinds';
import { hasArrayGotItems } from '@blog/utils/primitives';

type TPickerType = { name: string };

type TPickerGroup = { name: string; title?: string; of?: string[] };

type TModulePickerSection<T extends TPickerType> = {
  name: string;
  title: TMaybeUndefined<string>;
  types: T[];
};

const UNGROUPED_SECTION = 'ungrouped';

export const hasOffPlanModuleType = (
  types: readonly TPickerType[],
  entitledModulePacks: readonly TModulePack[],
) => types.some(({ name }) => getMissingModulePack(name, entitledModulePacks));

export const getModulePickerSections = <T extends TPickerType>({
  types,
  groups = [],
  entitledModulePacks,
  query,
}: {
  types: readonly T[];
  groups?: readonly TPickerGroup[];
  entitledModulePacks: readonly TModulePack[];
  query: string;
}) => {
  const needle = query.trim().toLowerCase();
  const matching = types.filter(({ name }) =>
    getModuleTitle(name).toLowerCase().includes(needle),
  );
  const offPlan = matching.filter(({ name }) =>
    getMissingModulePack(name, entitledModulePacks),
  );
  const available = matching.filter((type) => !offPlan.includes(type));
  const grouped = new Set(groups.flatMap((group) => group.of ?? []));

  const sections: TModulePickerSection<T>[] = [
    ...groups.map((group) => ({
      name: group.name,
      title: group.title ?? group.name,
      types: available.filter(({ name }) => group.of?.includes(name)),
    })),
    {
      name: UNGROUPED_SECTION,
      title: undefined,
      types: available.filter(({ name }) => !grouped.has(name)),
    },
  ].filter(({ types: sectionTypes }) => hasArrayGotItems(sectionTypes));

  return { sections, offPlan };
};
