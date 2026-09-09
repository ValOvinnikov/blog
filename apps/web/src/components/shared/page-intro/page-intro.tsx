import type { THeadingBlock, THeroModuleType } from '@blog/config';
import type { TModule } from '@blog/service';
import { PageHeading } from '@web/components/shared/page-heading';
import { HeroSlot } from '@web/modules/hero-slot';

export interface IPageIntroProps {
  hero?: TModule<THeroModuleType>;
  headingBlock?: THeadingBlock;
  hasTrailingSpace?: boolean;
  locale: string;
  tenant: string;
}

/**
 * PageIntro — a page's opening block: its hero when the page has one,
 * otherwise its page-level heading, otherwise nothing.
 */
export const PageIntro = ({
  hero,
  headingBlock,
  hasTrailingSpace,
  locale,
  tenant,
}: IPageIntroProps) =>
  hero ? (
    <HeroSlot id={hero.id} type={hero.type} locale={locale} tenant={tenant} />
  ) : headingBlock?.heading ? (
    <PageHeading
      headingBlock={headingBlock}
      hasTrailingSpace={hasTrailingSpace}
    />
  ) : null;
