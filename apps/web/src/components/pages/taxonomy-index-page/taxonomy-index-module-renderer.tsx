import type {
  THeadingBlock,
  TMaybeUndefined,
  TPageTagIndexType,
  TPageTopicIndexType,
  TContentAlignmentOf,
} from '@shinefold/config';
import type { TModule } from '@shinefold/service';
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

type TTaxonomyIndexModuleType = TPageTagIndexType | TPageTopicIndexType;

const TAXONOMY_INDEX_MAP: Partial<
  Record<TTaxonomyIndexModuleType, TModuleComponent>
> = {
  module_heroBlog: HeroBlogModule,
  module_taxonomyList: TaxonomyListModule,
  module_postLatest: PostLatestModule,
  module_cta: CtaModule,
  module_newsletter: NewsletterModule,
  module_content: ContentModule,
};

export interface ITaxonomyIndexModuleRendererProps {
  hero: TMaybeUndefined<TModule<TTaxonomyIndexModuleType>>;
  headingBlock: THeadingBlock;
  headingAlignment: TContentAlignmentOf<'LEFT' | 'CENTER'>;
  modules: TModule<TTaxonomyIndexModuleType>[];
}

export const TaxonomyIndexModuleRenderer = async ({
  hero,
  headingBlock,
  headingAlignment,
  modules,
}: ITaxonomyIndexModuleRendererProps): Promise<ReactNode> => {
  const heroNode = hero
    ? await renderHeroModule({ hero, map: TAXONOMY_INDEX_MAP })
    : null;

  return (
    <>
      {heroNode ?? (
        <PageHeading headingBlock={headingBlock} align={headingAlignment} />
      )}
      {renderModules({ modules, map: TAXONOMY_INDEX_MAP })}
    </>
  );
};
