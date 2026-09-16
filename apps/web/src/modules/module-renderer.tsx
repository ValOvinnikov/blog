import type { TModule } from '@blog/service';
import { logger } from '@web/utils/logger/logger';
import { Fragment, type ReactNode } from 'react';

import { MODULE_MAP, type TModuleComponentProps } from './module-map';

type TModuleMap = Record<
  string,
  (props: TModuleComponentProps) => Promise<ReactNode>
>;

export interface IRenderModulesProps {
  modules: TModule[];
  map: TModuleMap;
  locale: string;
  tenant: string;
  context?: TModuleComponentProps['context'];
}

export const renderModules = async ({
  modules,
  map,
  locale,
  tenant,
  context,
}: IRenderModulesProps): Promise<ReactNode> => {
  const rendered = await Promise.all(
    modules.map(async (module) => {
      const Component = map[module.type];

      if (!Component) {
        logger.warn('module_renderer.unknown_module_type', {
          moduleType: module.type,
        });
        return null;
      }

      return {
        key: module.id,
        node: await Component({ id: module.id, locale, tenant, context }),
      };
    }),
  );

  return (
    <>
      {rendered.map((entry) =>
        entry ? <Fragment key={entry.key}>{entry.node}</Fragment> : null,
      )}
    </>
  );
};

export interface IRenderHeroModuleProps {
  hero: TModule;
  map: TModuleMap;
  locale: string;
  tenant: string;
}

export const renderHeroModule = async ({
  hero,
  map,
  locale,
  tenant,
}: IRenderHeroModuleProps): Promise<ReactNode> => {
  const Component = map[hero.type];

  if (!Component) {
    logger.warn('hero_slot.unknown_hero_type', { heroType: hero.type });
    return null;
  }

  return Component({ id: hero.id, locale, tenant });
};

export interface IModuleRendererProps {
  modules: TModule[];
  locale: string;
  tenant: string;
  context?: TModuleComponentProps['context'];
}

export const ModuleRenderer = async (
  props: IModuleRendererProps,
): Promise<ReactNode> => renderModules({ ...props, map: MODULE_MAP });
