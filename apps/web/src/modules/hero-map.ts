import type { THeroModuleType } from '@blog/config';
import type { ReactNode } from 'react';

import { HeroModule } from './hero/hero-module';
import { HeroBlogModule } from './hero-blog/hero-blog-module';
import { HeroStatementModule } from './hero-statement/hero-statement-module';
import type { TModuleComponentProps } from './module-map';

export const HERO_MAP: Record<
  THeroModuleType,
  (props: TModuleComponentProps) => Promise<ReactNode>
> = {
  module_hero: HeroModule,
  module_heroBlog: HeroBlogModule,
  module_heroStatement: HeroStatementModule,
};
