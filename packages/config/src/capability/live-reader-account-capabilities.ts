import {
  READER_ACCOUNT_CAPABILITIES,
  type TCapability,
} from '@blog/config/constants';

import { isComingSoonCapability } from './is-coming-soon-capability';

export const LIVE_READER_ACCOUNT_CAPABILITIES: readonly TCapability[] =
  READER_ACCOUNT_CAPABILITIES.filter(
    (capability) => !isComingSoonCapability(capability),
  );
