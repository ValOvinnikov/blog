import {
  describeCtaModuleLayout,
  mockCtaLayoutProps,
} from '@blog/ui/testing/organisms/cta-module/layout-cases';

import { CtaModuleCallout } from './cta-module-callout';

describeCtaModuleLayout(CtaModuleCallout, mockCtaLayoutProps());
