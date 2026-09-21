import type {
  THeadingBlock,
  TMaybeUndefined,
  TPageTopicIndexType,
} from '@blog/config';
import type { TModule } from '@blog/service';
import { PageHeading } from '@web/components/shared/page-heading';
import { CtaModule } from '@web/modules/cta/cta-module';
import { HeroBlogModule } from '@web/modules/hero-blog/hero-blog-module';
import {
  renderHeroModule,
  renderModules,
  type TModuleComponent,
} from '@web/modules/module-renderer';
import { NewsletterModule } from '@web/modules/newsletter/newsletter-module';
import { PostLatestModule } from '@web/modules/post-latest/post-latest-module';
import { TaxonomyListModule } from '@web/modules/taxonomy-list/taxonomy-list-module';
import type { ReactNode } from 'react';

const TOPIC_INDEX_MAP: Partial<Record<TPageTopicIndexType, TModuleComponent>> =
  {
    module_heroBlog: HeroBlogModule,
    module_taxonomyList: TaxonomyListModule,
    module_postLatest: PostLatestModule,
    module_cta: CtaModule,
    module_newsletter: NewsletterModule,
  };

export interface ITopicIndexModuleRendererProps {
  hero: TMaybeUndefined<TModule<TPageTopicIndexType>>;
  headingBlock: THeadingBlock;
  modules: TModule<TPageTopicIndexType>[];
  locale: string;
  tenant: string;
}

export const TopicIndexModuleRenderer = async ({
  hero,
  headingBlock,
  modules,
  locale,
  tenant,
}: ITopicIndexModuleRendererProps): Promise<ReactNode> => {
  const heroNode = hero
    ? await renderHeroModule({ hero, map: TOPIC_INDEX_MAP, locale, tenant })
    : null;

  return (
    <>
      {heroNode ?? (
        <PageHeading headingBlock={headingBlock} hasTrailingSpace={false} />
      )}
      {renderModules({ modules, map: TOPIC_INDEX_MAP, locale, tenant })}
    </>
  );
};
