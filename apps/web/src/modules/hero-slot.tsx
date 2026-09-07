import type { TModuleType } from '@blog/config';
import { logger } from '@web/utils/logger/logger';
import type { ReactNode } from 'react';

import { HERO_MAP } from './hero-map';

export interface IHeroSlotProps {
  id: string;
  type: TModuleType;
  locale: string;
  tenant: string;
}

/**
 * HeroSlot — dispatches a page's `hero` slot to its registered hero
 * component via `HERO_MAP`. Renders nothing for a runtime type the map
 * doesn't know, since the page query can't narrow `_type` at the GROQ level.
 */
export const HeroSlot = async ({
  id,
  type,
  locale,
  tenant,
}: IHeroSlotProps): Promise<ReactNode> => {
  const Component = HERO_MAP[type as keyof typeof HERO_MAP];

  if (!Component) {
    logger.warn('hero_slot.unknown_hero_type', { heroType: type });
    return null;
  }

  return Component({ id, locale, tenant });
};
