import { modules } from '@blog/studio/schema-types/modules';

const titleByName = new Map<string, string>(
  modules.map((module) => [module.name, module.title ?? module.name]),
);

export const sortModulesByTitle = (names: string[]) =>
  [...names].sort((a, b) =>
    (titleByName.get(a) ?? a).localeCompare(titleByName.get(b) ?? b),
  );
