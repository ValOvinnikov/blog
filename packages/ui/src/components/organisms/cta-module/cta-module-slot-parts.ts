import type { ElementType } from 'react';

import { CtaModuleActions } from './components/actions/cta-module-actions';
import { CtaModuleEyebrow } from './components/eyebrow/cta-module-eyebrow';
import { CtaModuleFootnote } from './components/footnote/cta-module-footnote';
import { CtaModuleMedia } from './components/media/cta-module-media';
import { CtaModuleText } from './components/text/cta-module-text';

export const CtaModuleSlotParts = {
  Eyebrow: CtaModuleEyebrow,
  Text: CtaModuleText,
  Actions: CtaModuleActions,
  Footnote: CtaModuleFootnote,
  Media: CtaModuleMedia,
} satisfies Record<string, ElementType>;
