import type { TModuleType } from '@blog/config';
import type { ReactNode } from 'react';

import { ContentModule } from './content/content-module';
import { CtaModule } from './cta/cta-module';
import { NewsletterModule } from './newsletter/newsletter-module';
import { PostLatestModule } from './post-latest/post-latest-module';

export type TModuleComponentProps = {
  id: string;
  locale: string;
};

/**
 * Registry mapping every generic page-builder module `_type` to the
 * per-module Server Component that fetches and renders it. Typed as
 * `Record<Exclude<TModuleType, 'module_hero' | 'module_postList'>, …>` so
 * adding a module type without registering it here is a compile error.
 * `module_hero` and `module_postList` are both excluded: neither is ever a
 * member of a page's `modules[]` array — `module_hero` renders through the
 * home page template's dedicated `hero` slot, and `module_postList` renders
 * through the `postList` slot on `page_blog` (see `PostListModule`) — so
 * neither reaches this generic `ModuleRenderer` pipeline.
 */
export const MODULE_MAP: Record<
  Exclude<TModuleType, 'module_hero' | 'module_postList'>,
  (props: TModuleComponentProps) => Promise<ReactNode>
> = {
  module_postLatest: PostLatestModule,
  module_content: ContentModule,
  module_cta: CtaModule,
  module_newsletter: NewsletterModule,
};
