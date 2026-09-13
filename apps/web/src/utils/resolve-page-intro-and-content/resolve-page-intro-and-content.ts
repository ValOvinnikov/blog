import type { THeadingBlock, THeroModuleType } from '@blog/config';
import type { TModule } from '@blog/service';
import { PageIntro } from '@web/components/shared/page-intro';
import type { TModuleComponentProps } from '@web/modules/module-map';
import { ModuleRenderer } from '@web/modules/module-renderer';
import type { ReactNode } from 'react';

export interface IResolvePageIntroAndContentParams {
  hero?: TModule<THeroModuleType>;
  headingBlock: THeadingBlock;
  hasTrailingSpace?: boolean;
  modules: TModule[];
  locale: string;
  tenant: string;
  context?: TModuleComponentProps['context'];
}

export interface IPageIntroAndContent {
  intro: ReactNode;
  content: ReactNode;
}

/**
 * Resolves a page's opening block (`PageIntro`) and its page-builder
 * modules (`ModuleRenderer`) concurrently, so neither's fetch chain blocks
 * the other's from starting.
 */
export const resolvePageIntroAndContent = async ({
  hero,
  headingBlock,
  hasTrailingSpace,
  modules,
  locale,
  tenant,
  context,
}: IResolvePageIntroAndContentParams): Promise<IPageIntroAndContent> => {
  const [intro, content] = await Promise.all([
    PageIntro({ hero, headingBlock, hasTrailingSpace, locale, tenant }),
    ModuleRenderer({ modules, locale, tenant, context }),
  ]);

  return { intro, content };
};
