import type { THeroModuleType } from '@blog/config';
import type { TModule } from '@blog/service';
import { PageHeading } from '@web/components/shared/page-heading';
import { HeroSlot } from '@web/modules/hero-slot';

export interface IPageIntroProps {
  hero?: TModule<THeroModuleType>;
  heading?: string;
  supportingText?: string;
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
  heading,
  supportingText,
  hasTrailingSpace,
  locale,
  tenant,
}: IPageIntroProps) =>
  hero ? (
    <HeroSlot id={hero.id} type={hero.type} locale={locale} tenant={tenant} />
  ) : heading ? (
    <PageHeading
      heading={heading}
      supportingText={supportingText}
      hasTrailingSpace={hasTrailingSpace}
    />
  ) : null;
