import {
  describeCtaModuleLayout,
  mockCtaLayoutProps,
} from '@blog/ui/testing/organisms/cta-module/layout-cases';

import { CtaModuleBanner } from './cta-module-banner';

describeCtaModuleLayout(CtaModuleBanner, mockCtaLayoutProps());
