import type { TModuleType } from '@blog/config';
import type { ReactNode } from 'react';

import { HERO_MAP } from './hero-map';
import { renderHeroModule } from './module-renderer';

export interface IHeroSlotProps {
  id: string;
  type: TModuleType;
  locale: string;
  tenant: string;
}

export const HeroSlot = async ({
  id,
  type,
  locale,
  tenant,
}: IHeroSlotProps): Promise<ReactNode> =>
  renderHeroModule({ hero: { id, type }, map: HERO_MAP, locale, tenant });
