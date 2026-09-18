import type {
  THeadingBlock,
  TMaybeUndefined,
  TPageTopicIndexType,
} from '@blog/config';
import type { TModule } from '@blog/service';
import { PageHeading } from '@web/components/shared/page-heading';
import { CtaModule } from '@web/modules/cta/cta-module';
import { HeroModule } from '@web/modules/hero/hero-module';
import { HeroBlogModule } from '@web/modules/hero-blog/hero-blog-module';
import { HeroStatementModule } from '@web/modules/hero-statement/hero-statement-module';
import type { TModuleComponent } from '@web/modules/module-map';
import { renderHeroModule, renderModules } from '@web/modules/module-renderer';
import { NewsletterModule } from '@web/modules/newsletter/newsletter-module';
import { PostLatestModule } from '@web/modules/post-latest/post-latest-module';
import { TaxonomyListModule } from '@web/modules/taxonomy-list/taxonomy-list-module';
import type { ReactNode } from 'react';

const TOPICS_MAP: Record<TPageTopicIndexType, TModuleComponent> = {
  module_hero: HeroModule,
  module_heroBlog: HeroBlogModule,
  module_heroStatement: HeroStatementModule,
  module_taxonomyList: TaxonomyListModule,
  module_postLatest: PostLatestModule,
  module_cta: CtaModule,
  module_newsletter: NewsletterModule,
};

export interface ITopicsModuleRendererProps {
  hero: TMaybeUndefined<TModule<TPageTopicIndexType>>;
  headingBlock: THeadingBlock;
  modules: TModule<TPageTopicIndexType>[];
  locale: string;
  tenant: string;
}

export const TopicsModuleRenderer = async ({
  hero,
  headingBlock,
  modules,
  locale,
  tenant,
}: ITopicsModuleRendererProps): Promise<ReactNode> => {
  const heroNode = hero
    ? await renderHeroModule({ hero, map: TOPICS_MAP, locale, tenant })
    : null;

  return (
    <>
      {heroNode ?? (
        <PageHeading headingBlock={headingBlock} hasTrailingSpace={false} />
      )}
      {renderModules({ modules, map: TOPICS_MAP, locale, tenant })}
    </>
  );
};
