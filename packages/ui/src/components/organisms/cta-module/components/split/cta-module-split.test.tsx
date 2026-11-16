import { CONTENT_ALIGNMENT } from '@shinefold/config';
import {
  describeCtaModuleLayout,
  mockCtaLayoutProps,
} from '@shinefold/ui/testing/organisms/cta-module/layout-cases';

import { CtaModuleSplit } from './cta-module-split';

describeCtaModuleLayout(CtaModuleSplit, {
  ...mockCtaLayoutProps(),
  contentPosition: CONTENT_ALIGNMENT.RIGHT,
});
