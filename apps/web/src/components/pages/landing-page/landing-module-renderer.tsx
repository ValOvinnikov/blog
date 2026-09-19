import type {
  THeadingBlock,
  TMaybeUndefined,
  TPageLandingType,
} from '@blog/config';
import type { TModule } from '@blog/service';
import { PageHeading } from '@web/components/shared/page-heading';
import { ContentModule } from '@web/modules/content/content-module';
import { CtaModule } from '@web/modules/cta/cta-module';
import { FeatureListModule } from '@web/modules/feature-list/feature-list-module';
import { HeroBlogModule } from '@web/modules/hero-blog/hero-blog-module';
import { HeroProfileModule } from '@web/modules/hero-profile/hero-profile-module';
import { HeroStatementModule } from '@web/modules/hero-statement/hero-statement-module';
import {
  renderHeroModule,
  renderModules,
  type TModuleComponent,
} from '@web/modules/module-renderer';
import { NewsletterModule } from '@web/modules/newsletter/newsletter-module';
import { PostFeaturedModule } from '@web/modules/post-featured/post-featured-module';
import { PostLatestModule } from '@web/modules/post-latest/post-latest-module';
import { TaxonomyListModule } from '@web/modules/taxonomy-list/taxonomy-list-module';
import type { ReactNode } from 'react';

const LANDING_MAP: Partial<Record<TPageLandingType, TModuleComponent>> = {
  module_heroBlog: HeroBlogModule,
  module_heroProfile: HeroProfileModule,
  module_heroStatement: HeroStatementModule,
  module_content: ContentModule,
  module_cta: CtaModule,
  module_newsletter: NewsletterModule,
  module_postLatest: PostLatestModule,
  module_taxonomyList: TaxonomyListModule,
  module_postFeatured: PostFeaturedModule,
  module_featureList: FeatureListModule,
};

export interface ILandingModuleRendererProps {
  hero: TMaybeUndefined<TModule<TPageLandingType>>;
  headingBlock: THeadingBlock;
  modules: TModule<TPageLandingType>[];
  locale: string;
  tenant: string;
}

export const LandingModuleRenderer = async ({
  hero,
  headingBlock,
  modules,
  locale,
  tenant,
}: ILandingModuleRendererProps): Promise<ReactNode> => {
  const heroNode = hero
    ? await renderHeroModule({ hero, map: LANDING_MAP, locale, tenant })
    : null;

  return (
    <>
      {heroNode ?? <PageHeading headingBlock={headingBlock} />}
      {renderModules({ modules, map: LANDING_MAP, locale, tenant })}
    </>
  );
};
