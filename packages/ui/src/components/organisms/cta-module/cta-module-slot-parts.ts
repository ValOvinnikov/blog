import { Footnote } from '@shinefold/ui/components/atoms/footnote';
import type { ElementType } from 'react';

import { CtaModuleActions } from './components/actions/cta-module-actions';
import { CtaModuleEyebrow } from './components/eyebrow/cta-module-eyebrow';
import { CtaModuleMedia } from './components/media/cta-module-media';
import { CtaModuleText } from './components/text/cta-module-text';

export const CtaModuleSlotParts = {
  Eyebrow: CtaModuleEyebrow,
  Text: CtaModuleText,
  Actions: CtaModuleActions,
  Footnote,
  Media: CtaModuleMedia,
} satisfies Record<string, ElementType>;
