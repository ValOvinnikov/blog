import type {
  THeadingBlock,
  TMaybeUndefined,
  TPageTagType,
  TPageTopicType,
  TContentAlignmentOf,
} from '@shinefold/config';
import type { TModule } from '@shinefold/service';
import { PageHeading } from '@web/components/shared/page-heading';
import { ContentModule } from '@web/modules/content/content-module';
import { CtaModule } from '@web/modules/cta/cta-module';
import { FaqModule } from '@web/modules/faq/faq-module';
import { HeroBlogModule } from '@web/modules/hero-blog/hero-blog-module';
import {
  renderHeroModule,
  renderModules,
  type TModuleComponent,
  type TModuleComponentProps,
} from '@web/modules/module-renderer';
import { NewsletterModule } from '@web/modules/newsletter/newsletter-module';
import { PostLatestModule } from '@web/modules/post-latest/post-latest-module';
import { PostListModule } from '@web/modules/post-list/post-list-module';
import { TaxonomyListModule } from '@web/modules/taxonomy-list/taxonomy-list-module';
import type { ReactNode } from 'react';

type TTaxonomyModuleType = TPageTagType | TPageTopicType;

const TAXONOMY_MAP: Partial<Record<TTaxonomyModuleType, TModuleComponent>> = {
  module_heroBlog: HeroBlogModule,
  module_postList: PostListModule,
  module_postLatest: PostLatestModule,
  module_taxonomyList: TaxonomyListModule,
  module_cta: CtaModule,
  module_newsletter: NewsletterModule,
  module_content: ContentModule,
  module_faq: FaqModule,
};

export interface ITaxonomyModuleRendererProps {
  hero: TMaybeUndefined<TModule<TTaxonomyModuleType>>;
  headingBlock: THeadingBlock;
  headingAlignment: TContentAlignmentOf<'LEFT' | 'CENTER'>;
  modules: TModule<TTaxonomyModuleType>[];
  context?: TModuleComponentProps['context'];
  children?: ReactNode;
}

export const TaxonomyModuleRenderer = async ({
  hero,
  headingBlock,
  headingAlignment,
  modules,
  context,
  children,
}: ITaxonomyModuleRendererProps): Promise<ReactNode> => {
  const heroNode = hero
    ? await renderHeroModule({ hero, map: TAXONOMY_MAP })
    : null;

  return (
    <>
      {heroNode ?? (
        <PageHeading headingBlock={headingBlock} align={headingAlignment} />
      )}
      {renderModules({
        modules,
        map: TAXONOMY_MAP,
        context,
        slot: children
          ? { moduleType: 'module_postList', node: children }
          : undefined,
      })}
    </>
  );
};
