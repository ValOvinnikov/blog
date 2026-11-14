import type { TTaxonomyKind } from '@blog/config';
import type { TModule } from '@blog/service';
import { MODULE_RENDERER_LOG } from '@web/constants/module-renderer';
import { ModuleGate } from '@web/modules/module-gate/module-gate';
import { isModuleEntitled } from '@web/server/settings-features/is-module-entitled/is-module-entitled';
import { logger } from '@web/utils/logger/logger';
import type { PropsWithChildren, ReactNode } from 'react';

import { moduleSlotVariants } from './module-renderer-variants';

export type TModuleComponentProps = PropsWithChildren<{
  id: string;
  context?: {
    post?: { id: string };
    homePage?: { id: string };
    landingPage?: { id: string; path: string };
    page?: number;
    archive?: {
      id: string;
      kind: TTaxonomyKind;
      slug: string;
      name: string;
    };
  };
}>;

export type TModuleComponent = (
  props: TModuleComponentProps,
) => Promise<ReactNode>;

type TModuleMap = Partial<
  Record<
    string,
    (props: TModuleComponentProps) => ReactNode | Promise<ReactNode>
  >
>;

interface IModuleSlot {
  moduleType: TModule['type'];
  node: ReactNode;
}

export interface IRenderModulesProps {
  modules: TModule[];
  map: TModuleMap;
  context?: TModuleComponentProps['context'];
  slot?: IModuleSlot;
}

export const renderModules = ({
  modules,
  map,
  context,
  slot,
}: IRenderModulesProps): ReactNode => {
  const slotHostId = slot
    ? modules.find(({ type }) => type === slot.moduleType)?.id
    : undefined;

  return (
    <>
      {slot && !slotHostId ? (
        <div className={moduleSlotVariants()}>{slot.node}</div>
      ) : null}
      {modules.map((module) => {
        const Component = map[module.type];

        if (!Component) {
          logger.warn(MODULE_RENDERER_LOG.UNKNOWN_MODULE_TYPE, {
            moduleType: module.type,
          });
          return null;
        }

        return (
          <ModuleGate key={module.id} moduleType={module.type}>
            <Component id={module.id} context={context}>
              {module.id === slotHostId ? slot?.node : undefined}
            </Component>
          </ModuleGate>
        );
      })}
    </>
  );
};

export interface IRenderHeroModuleProps {
  hero: TModule;
  map: TModuleMap;
}

export const renderHeroModule = async ({
  hero,
  map,
}: IRenderHeroModuleProps): Promise<ReactNode> => {
  const Component = map[hero.type];

  if (!Component) {
    logger.warn(MODULE_RENDERER_LOG.UNKNOWN_HERO_TYPE, { heroType: hero.type });
    return null;
  }

  if (!(await isModuleEntitled(hero.type))) return null;

  return Component({ id: hero.id });
};
