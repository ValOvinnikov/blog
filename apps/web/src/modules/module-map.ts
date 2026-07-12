import type { TModuleType } from '@blog/config';
import type { ReactNode } from 'react';

import { ContentModule } from './content/content-module';
import { CtaModule } from './cta/cta-module';
import { HeroModule } from './hero/hero-module';
import { PostListModule } from './post-list/post-list-module';

export type TModuleComponentProps = {
  id: string;
  locale: string;
};

/**
 * Registry mapping every module `_type` to the per-module Server Component
 * that fetches and renders it. Typed as `Record<TModuleType, …>` so adding a
 * module type without registering it here is a compile error.
 */
export const MODULE_MAP: Record<
  TModuleType,
  (props: TModuleComponentProps) => Promise<ReactNode>
> = {
  module_hero: HeroModule,
  module_postList: PostListModule,
  module_content: ContentModule,
  module_cta: CtaModule,
};
