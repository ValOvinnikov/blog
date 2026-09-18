import type {
  THeadingBlock,
  TMaybeUndefined,
  TPagePostIndexType,
} from '@blog/config';
import type { TModule } from '@blog/service';
import { PageHeading } from '@web/components/shared/page-heading';
import { CtaModule } from '@web/modules/cta/cta-module';
import { HeroModule } from '@web/modules/hero/hero-module';
import { HeroBlogModule } from '@web/modules/hero-blog/hero-blog-module';
import { HeroStatementModule } from '@web/modules/hero-statement/hero-statement-module';
import type {
  TModuleComponent,
  TModuleComponentProps,
} from '@web/modules/module-map';
import { renderHeroModule, renderModules } from '@web/modules/module-renderer';
import { NewsletterModule } from '@web/modules/newsletter/newsletter-module';
import { PostFeaturedModule } from '@web/modules/post-featured/post-featured-module';
import { PostListModule } from '@web/modules/post-list/post-list-module';
import type { ReactNode } from 'react';

const BLOG_LIST_MAP: Record<TPagePostIndexType, TModuleComponent> = {
  module_hero: HeroModule,
  module_heroBlog: HeroBlogModule,
  module_heroStatement: HeroStatementModule,
  module_postList: PostListModule,
  module_cta: CtaModule,
  module_newsletter: NewsletterModule,
  module_postFeatured: PostFeaturedModule,
};

export interface IBlogListModuleRendererProps {
  hero: TMaybeUndefined<TModule<TPagePostIndexType>>;
  headingBlock: THeadingBlock;
  modules: TModule<TPagePostIndexType>[];
  locale: string;
  tenant: string;
  context?: TModuleComponentProps['context'];
  children?: ReactNode;
}

/**
 * BlogListModuleRenderer — the blog list page's own hero and heading
 * fallback, followed by the modules its schema allows.
 */
export const BlogListModuleRenderer = async ({
  hero,
  headingBlock,
  modules,
  locale,
  tenant,
  context,
  children,
}: IBlogListModuleRendererProps): Promise<ReactNode> => {
  const heroNode = hero
    ? await renderHeroModule({ hero, map: BLOG_LIST_MAP, locale, tenant })
    : null;

  return (
    <>
      {heroNode ?? <PageHeading headingBlock={headingBlock} />}
      {children}
      {renderModules({ modules, map: BLOG_LIST_MAP, locale, tenant, context })}
    </>
  );
};
