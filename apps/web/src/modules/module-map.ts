import type { TModuleType } from '@blog/config';
import type { ReactNode } from 'react';

import { ContentModule } from './content/content-module';
import { CtaModule } from './cta/cta-module';
import { PostListModule } from './post-list/post-list-module';

export type TModuleComponentProps = {
  id: string;
  locale: string;
};

/**
 * Registry mapping every generic page-builder module `_type` to the
 * per-module Server Component that fetches and renders it. Typed as
 * `Record<Exclude<TModuleType, 'module_hero'>, …>` so adding a module type
 * without registering it here is a compile error. `module_hero` is
 * deliberately excluded: it is never a member of a page's `modules[]`
 * array — the CMS schema only allows `content`/`cta` (`page.ts`) or
 * `postList`/`cta` (`home-page.ts`) there — and is instead rendered via the
 * dedicated `hero` prop/slot on the home page template, never through this
 * generic `ModuleRenderer` pipeline.
 */
export const MODULE_MAP: Record<
  Exclude<TModuleType, 'module_hero'>,
  (props: TModuleComponentProps) => Promise<ReactNode>
> = {
  module_postList: PostListModule,
  module_content: ContentModule,
  module_cta: CtaModule,
};
