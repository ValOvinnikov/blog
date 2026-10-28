import { MODULE_PACK, type TModulePack } from '@blog/config/constants';

export const EVERY_MODULE_PACK: readonly TModulePack[] =
  Object.values(MODULE_PACK);

let entitledModulePacks = EVERY_MODULE_PACK;

export const setEntitledModulePacks = (packs: readonly TModulePack[]) => {
  entitledModulePacks = packs;
};

export const getEntitledModulePacks = () => entitledModulePacks;
