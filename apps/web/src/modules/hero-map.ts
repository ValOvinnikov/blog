import type { THeroModuleType } from '@blog/config';
import type { ReactNode } from 'react';

import { HeroModule } from './hero/hero-module';
import { HeroBlogModule } from './hero-blog/hero-blog-module';
import { HeroStatementModule } from './hero-statement/hero-statement-module';
import type { TModuleComponentProps } from './module-map';

/**
 * Registry mapping every `module_hero*` `_type` to the per-hero Server
 * Component that fetches and renders it. Typed as `Record<THeroModuleType,
 * …>` so a new hero-family schema without a registered entry is a compile
 * error.
 */
export const HERO_MAP: Record<
  THeroModuleType,
  (props: TModuleComponentProps) => Promise<ReactNode>
> = {
  module_hero: HeroModule,
  module_heroBlog: HeroBlogModule,
  module_heroStatement: HeroStatementModule,
};
