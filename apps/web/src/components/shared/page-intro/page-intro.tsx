import type { THeadingBlock, THeroModuleType } from '@blog/config';
import type { TModule } from '@blog/service';
import { PageHeading } from '@web/components/shared/page-heading';
import { HeroSlot } from '@web/modules/hero-slot';
import type { ReactNode } from 'react';

export interface IPageIntroProps {
  hero?: TModule<THeroModuleType>;
  headingBlock: THeadingBlock;
  hasTrailingSpace?: boolean;
  locale: string;
  tenant: string;
}

/**
 * PageIntro — a page's opening block: its hero when the page has one and it
 * resolves to content, otherwise its page-level heading.
 */
export const PageIntro = async ({
  hero,
  headingBlock,
  hasTrailingSpace,
  locale,
  tenant,
}: IPageIntroProps): Promise<ReactNode> => {
  const heroNode = hero
    ? await HeroSlot({ id: hero.id, type: hero.type, locale, tenant })
    : null;

  if (heroNode) {
    return heroNode;
  }

  return (
    <PageHeading
      headingBlock={headingBlock}
      hasTrailingSpace={hasTrailingSpace}
    />
  );
};
