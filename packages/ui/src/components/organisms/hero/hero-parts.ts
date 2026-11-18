import type { ElementType } from 'react';

import { HeroAvatar } from './components/avatar/hero-avatar';
import { HeroBody } from './components/body/hero-body';
import { HeroCta } from './components/cta/hero-cta';
import { HeroMedia } from './components/media/hero-media';
import { HeroSocial } from './components/social/hero-social';

export const HeroParts = {
  Avatar: HeroAvatar,
  Media: HeroMedia,
  Body: HeroBody,
  Cta: HeroCta,
  Social: HeroSocial,
} satisfies Record<string, ElementType>;
