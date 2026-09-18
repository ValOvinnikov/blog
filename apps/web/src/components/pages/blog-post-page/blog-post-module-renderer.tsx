import type { TPagePostType } from '@blog/config';
import type { TModule } from '@blog/service';
import { CtaModule } from '@web/modules/cta/cta-module';
import {
  renderModules,
  type TModuleComponent,
  type TModuleComponentProps,
} from '@web/modules/module-renderer';
import { NewsletterModule } from '@web/modules/newsletter/newsletter-module';
import { PostRelatedModule } from '@web/modules/post-related/post-related-module';
import type { ReactNode } from 'react';

const BLOG_POST_MAP: Record<TPagePostType, TModuleComponent> = {
  module_postRelated: PostRelatedModule,
  module_newsletter: NewsletterModule,
  module_cta: CtaModule,
};

export interface IBlogPostModuleRendererProps {
  modules: TModule<TPagePostType>[];
  locale: string;
  tenant: string;
  context?: TModuleComponentProps['context'];
}

export const BlogPostModuleRenderer = ({
  modules,
  locale,
  tenant,
  context,
}: IBlogPostModuleRendererProps): ReactNode =>
  renderModules({ modules, map: BLOG_POST_MAP, locale, tenant, context });
