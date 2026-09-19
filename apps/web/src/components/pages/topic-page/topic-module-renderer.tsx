import type {
  THeadingBlock,
  TMaybeUndefined,
  TPageTopicType,
} from '@blog/config';
import type { TModule } from '@blog/service';
import { PageHeading } from '@web/components/shared/page-heading';
import { CtaModule } from '@web/modules/cta/cta-module';
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

const TOPIC_MAP: Partial<Record<TPageTopicType, TModuleComponent>> = {
  module_heroBlog: HeroBlogModule,
  module_postList: PostListModule,
  module_postLatest: PostLatestModule,
  module_taxonomyList: TaxonomyListModule,
  module_cta: CtaModule,
  module_newsletter: NewsletterModule,
};

export interface ITopicModuleRendererProps {
  hero: TMaybeUndefined<TModule<TPageTopicType>>;
  headingBlock: THeadingBlock;
  modules: TModule<TPageTopicType>[];
  locale: string;
  tenant: string;
  context?: TModuleComponentProps['context'];
  children?: ReactNode;
}

export const TopicModuleRenderer = async ({
  hero,
  headingBlock,
  modules,
  locale,
  tenant,
  context,
  children,
}: ITopicModuleRendererProps): Promise<ReactNode> => {
  const heroNode = hero
    ? await renderHeroModule({ hero, map: TOPIC_MAP, locale, tenant })
    : null;

  return (
    <>
      {heroNode ?? <PageHeading headingBlock={headingBlock} />}
      {children}
      {renderModules({ modules, map: TOPIC_MAP, locale, tenant, context })}
    </>
  );
};
