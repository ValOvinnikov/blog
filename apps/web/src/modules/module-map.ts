import type { TModuleType, TSlotModuleType } from '@blog/config';
import type { ReactNode } from 'react';

import { ContentModule } from './content/content-module';
import { CtaModule } from './cta/cta-module';
import { NewsletterModule } from './newsletter/newsletter-module';
import { PostFeaturedModule } from './post-featured/post-featured-module';
import { PostLatestModule } from './post-latest/post-latest-module';
import { PostRelatedModule } from './post-related/post-related-module';
import { TaxonomyListModule } from './taxonomy-list/taxonomy-list-module';

export type TModuleComponentProps = {
  id: string;
  locale: string;
  tenant: string;
  /** The post the module renders alongside, when the module sits on a `page_post`'s `modules[]`. Absent everywhere else. */
  context?: { post?: { id: string } };
};

/**
 * Registry mapping every generic page-builder module `_type` to the
 * per-module Server Component that fetches and renders it. Typed as
 * `Record<Exclude<TModuleType, TSlotModuleType>, …>` so adding a module type
 * without registering it here is a compile error. Every remaining
 * `TSlotModuleType` member (the hero family, `module_postList`) renders
 * through its own page's dedicated slot instead of a page's `modules[]`
 * array, so it never reaches this generic `ModuleRenderer` pipeline.
 */
export const MODULE_MAP: Record<
  Exclude<TModuleType, TSlotModuleType>,
  (props: TModuleComponentProps) => Promise<ReactNode>
> = {
  module_postLatest: PostLatestModule,
  module_postFeatured: PostFeaturedModule,
  module_postRelated: PostRelatedModule,
  module_content: ContentModule,
  module_cta: CtaModule,
  module_newsletter: NewsletterModule,
  module_taxonomyList: TaxonomyListModule,
};
