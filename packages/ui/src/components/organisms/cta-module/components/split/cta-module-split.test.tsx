import { CONTENT_ALIGNMENT } from '@blog/config';
import {
  describeCtaModuleLayout,
  mockCtaLayoutProps,
} from '@blog/ui/testing/organisms/cta-module/layout-cases';

import { CtaModuleSplit } from './cta-module-split';

describeCtaModuleLayout(CtaModuleSplit, {
  ...mockCtaLayoutProps(),
  contentPosition: CONTENT_ALIGNMENT.RIGHT,
});
