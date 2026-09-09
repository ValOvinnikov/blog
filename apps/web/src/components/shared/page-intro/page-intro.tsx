import type { THeroModuleType } from '@blog/config';
import type { TModule } from '@blog/service';
import { HeroSlot } from '@web/modules/hero-slot';
import type { ReactNode } from 'react';

export interface IPageIntroProps {
  hero?: TModule<THeroModuleType>;
  locale: string;
  tenant: string;
  children?: ReactNode;
}

/**
 * PageIntro — a page's opening block: its hero when the page has one,
 * otherwise the caller's fallback.
 */
export const PageIntro = ({
  hero,
  locale,
  tenant,
  children,
}: IPageIntroProps) => (
  <>
    {hero ? (
      <HeroSlot id={hero.id} type={hero.type} locale={locale} tenant={tenant} />
    ) : (
      children
    )}
  </>
);
