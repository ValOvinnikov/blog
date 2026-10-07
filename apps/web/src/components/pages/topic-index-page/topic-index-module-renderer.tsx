import type {
  THeadingBlock,
  TMaybeUndefined,
  TPageTopicIndexType,
  TContentAlignmentOf,
} from '@blog/config';
import type { TModule } from '@blog/service';
import { PageHeading } from '@web/components/shared/page-heading';
import { ContentModule } from '@web/modules/content/content-module';
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
    module_content: ContentModule,
  };

export interface ITopicIndexModuleRendererProps {
  hero: TMaybeUndefined<TModule<TPageTopicIndexType>>;
  headingBlock: THeadingBlock;
  headingAlignment: TContentAlignmentOf<'LEFT' | 'CENTER'>;
  modules: TModule<TPageTopicIndexType>[];
}

export const TopicIndexModuleRenderer = async ({
  hero,
  headingBlock,
  headingAlignment,
  modules,
}: ITopicIndexModuleRendererProps): Promise<ReactNode> => {
  const heroNode = hero
    ? await renderHeroModule({ hero, map: TOPIC_INDEX_MAP })
    : null;

  return (
    <>
      {heroNode ?? (
        <PageHeading headingBlock={headingBlock} align={headingAlignment} />
      )}
      {renderModules({ modules, map: TOPIC_INDEX_MAP })}
    </>
  );
};
