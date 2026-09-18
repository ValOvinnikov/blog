import type { TTaxonomyKind } from '@blog/config';
import type { TModule } from '@blog/service';
import { logger } from '@web/utils/logger/logger';
import type { ReactNode } from 'react';

export type TModuleComponentProps = {
  id: string;
  locale: string;
  tenant: string;
  context?: {
    post?: { id: string };
    page?: number;
    archive?: { kind: TTaxonomyKind; slug: string; name: string };
  };
};

export type TModuleComponent = (
  props: TModuleComponentProps,
) => Promise<ReactNode>;

type TModuleMap = Record<
  string,
  (props: TModuleComponentProps) => ReactNode | Promise<ReactNode>
>;

export interface IRenderModulesProps {
  modules: TModule[];
  map: TModuleMap;
  locale: string;
  tenant: string;
  context?: TModuleComponentProps['context'];
}

export const renderModules = ({
  modules,
  map,
  locale,
  tenant,
  context,
}: IRenderModulesProps): ReactNode =>
  modules.map((module) => {
    const Component = map[module.type];

    if (!Component) {
      logger.warn('module_renderer.unknown_module_type', {
        moduleType: module.type,
      });
      return null;
    }

    return (
      <Component
        key={module.id}
        id={module.id}
        locale={locale}
        tenant={tenant}
        context={context}
      />
    );
  });

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
