import { CtaModuleActions } from './components/actions/cta-module-actions';
import { CtaModuleBanner } from './components/banner/cta-module-banner';
import { CtaModuleCallout } from './components/callout/cta-module-callout';
import { CtaModuleEyebrow } from './components/eyebrow/cta-module-eyebrow';
import { CtaModuleFootnote } from './components/footnote/cta-module-footnote';
import { CtaModuleMedia } from './components/media/cta-module-media';
import { CtaModuleSplit } from './components/split/cta-module-split';
import { CtaModuleText } from './components/text/cta-module-text';

export type { TCtaModuleBannerProps } from './components/banner/cta-module-banner';
export type { TCtaModuleCalloutProps } from './components/callout/cta-module-callout';
export type { TCtaModuleSplitProps } from './components/split/cta-module-split';

/** A page-builder call-to-action in three layouts — `Split`, `Banner` and `Callout` — each filled through the `Eyebrow`, `Text`, `Actions`, `Footnote` and `Media` slots. */
export const CtaModule = {
  Split: CtaModuleSplit,
  Banner: CtaModuleBanner,
  Callout: CtaModuleCallout,
  Eyebrow: CtaModuleEyebrow,
  Text: CtaModuleText,
  Actions: CtaModuleActions,
  Footnote: CtaModuleFootnote,
  Media: CtaModuleMedia,
};
