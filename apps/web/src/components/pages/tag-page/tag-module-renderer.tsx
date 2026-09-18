import type {
  THeadingBlock,
  TMaybeUndefined,
  TPageTagType,
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

const TAG_MAP: Partial<Record<TPageTagType, TModuleComponent>> = {
  module_heroBlog: HeroBlogModule,
  module_postList: PostListModule,
  module_postLatest: PostLatestModule,
  module_taxonomyList: TaxonomyListModule,
  module_cta: CtaModule,
  module_newsletter: NewsletterModule,
};

export interface ITagModuleRendererProps {
  hero: TMaybeUndefined<TModule<TPageTagType>>;
  headingBlock: THeadingBlock;
  hasTrailingSpace?: boolean;
  modules: TModule<TPageTagType>[];
  context?: TModuleComponentProps['context'];
  locale: string;
  tenant: string;
}

/**
 * TagModuleRenderer — the tag page's own hero and heading fallback,
 * followed by the modules the tag page's schema allows.
 */
export const TagModuleRenderer = async ({
  hero,
  headingBlock,
  hasTrailingSpace,
  modules,
  context,
  locale,
  tenant,
}: ITagModuleRendererProps): Promise<ReactNode> => {
  const heroNode = hero
    ? await renderHeroModule({ hero, map: TAG_MAP, locale, tenant })
    : null;

  return (
    <>
      {heroNode ?? (
        <PageHeading
          headingBlock={headingBlock}
          hasTrailingSpace={hasTrailingSpace}
        />
      )}
      {renderModules({ modules, map: TAG_MAP, locale, tenant, context })}
    </>
  );
};
