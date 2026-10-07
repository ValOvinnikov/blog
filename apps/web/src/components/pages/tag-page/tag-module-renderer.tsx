import type {
  THeadingBlock,
  TMaybeUndefined,
  TPageTagType,
  TContentAlignmentOf,
} from '@blog/config';
import type { TModule } from '@blog/service';
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

const TAG_MAP: Partial<Record<TPageTagType, TModuleComponent>> = {
  module_heroBlog: HeroBlogModule,
  module_postList: PostListModule,
  module_postLatest: PostLatestModule,
  module_taxonomyList: TaxonomyListModule,
  module_cta: CtaModule,
  module_newsletter: NewsletterModule,
  module_content: ContentModule,
  module_faq: FaqModule,
};

export interface ITagModuleRendererProps {
  hero: TMaybeUndefined<TModule<TPageTagType>>;
  headingBlock: THeadingBlock;
  headingAlignment: TContentAlignmentOf<'LEFT' | 'CENTER'>;
  modules: TModule<TPageTagType>[];
  context?: TModuleComponentProps['context'];
}

export const TagModuleRenderer = async ({
  hero,
  headingBlock,
  headingAlignment,
  modules,
  context,
}: ITagModuleRendererProps): Promise<ReactNode> => {
  const heroNode = hero ? await renderHeroModule({ hero, map: TAG_MAP }) : null;

  return (
    <>
      {heroNode ?? (
        <PageHeading headingBlock={headingBlock} align={headingAlignment} />
      )}
      {renderModules({ modules, map: TAG_MAP, context })}
    </>
  );
};
