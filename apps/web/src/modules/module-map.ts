import { MODULE_TYPE } from '@blog/config';
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
 * Registry mapping every `MODULE_TYPE` to the per-module Server Component
 * that fetches and renders it. Typed as `Record<TModuleType, …>` so adding a
 * module type without registering it here is a compile error.
 */
export const MODULE_MAP: Record<
  TModuleType,
  (props: TModuleComponentProps) => Promise<ReactNode>
> = {
  [MODULE_TYPE.HERO]: HeroModule,
  [MODULE_TYPE.POST_LIST]: PostListModule,
  [MODULE_TYPE.CONTENT]: ContentModule,
  [MODULE_TYPE.CTA]: CtaModule,
};
