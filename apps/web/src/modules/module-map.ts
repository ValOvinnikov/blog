import type { TModuleType, TSlotModuleType, TTaxonomyKind } from '@blog/config';
import type { ReactNode } from 'react';

import { ContentModule } from './content/content-module';
import { CtaModule } from './cta/cta-module';
import { NewsletterModule } from './newsletter/newsletter-module';
import { PostFeaturedModule } from './post-featured/post-featured-module';
import { PostLatestModule } from './post-latest/post-latest-module';
import { PostListModule } from './post-list/post-list-module';
import { PostRelatedModule } from './post-related/post-related-module';
import { TaxonomyListModule } from './taxonomy-list/taxonomy-list-module';

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

export const MODULE_MAP: Record<
  Exclude<TModuleType, TSlotModuleType>,
  (props: TModuleComponentProps) => Promise<ReactNode>
> = {
  module_postLatest: PostLatestModule,
  module_postFeatured: PostFeaturedModule,
  module_postList: PostListModule,
  module_postRelated: PostRelatedModule,
  module_content: ContentModule,
  module_cta: CtaModule,
  module_newsletter: NewsletterModule,
  module_taxonomyList: TaxonomyListModule,
};
