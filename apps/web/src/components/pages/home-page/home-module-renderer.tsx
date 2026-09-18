import type {
  THeadingBlock,
  TMaybeUndefined,
  TPageHomeType,
} from '@blog/config';
import type { TModule } from '@blog/service';
import { PageHeading } from '@web/components/shared/page-heading';
import { ContentModule } from '@web/modules/content/content-module';
import { CtaModule } from '@web/modules/cta/cta-module';
import { HeroBlogModule } from '@web/modules/hero-blog/hero-blog-module';
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

const HOME_MAP: Record<TPageHomeType, TModuleComponent> = {
  module_heroBlog: HeroBlogModule,
  module_heroStatement: HeroStatementModule,
  module_content: ContentModule,
  module_cta: CtaModule,
  module_newsletter: NewsletterModule,
  module_postLatest: PostLatestModule,
  module_taxonomyList: TaxonomyListModule,
  module_postFeatured: PostFeaturedModule,
};

export interface IHomeModuleRendererProps {
  hero: TMaybeUndefined<TModule<TPageHomeType>>;
  headingBlock: THeadingBlock;
  modules: TModule[];
  locale: string;
  tenant: string;
}

/**
 * HomeModuleRenderer — the home page's own hero and heading fallback,
 * followed by the modules the home page's schema allows.
 */
export const HomeModuleRenderer = async ({
  hero,
  headingBlock,
  modules,
  locale,
  tenant,
}: IHomeModuleRendererProps): Promise<ReactNode> => {
  const heroNode = hero
    ? await renderHeroModule({ hero, map: HOME_MAP, locale, tenant })
    : null;

  return (
    <>
      {heroNode ?? <PageHeading headingBlock={headingBlock} />}
      {renderModules({ modules, map: HOME_MAP, locale, tenant })}
    </>
  );
};
