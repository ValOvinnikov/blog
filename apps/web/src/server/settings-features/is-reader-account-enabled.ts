import { CAPABILITY } from '@blog/config';

import { isCapabilityEnabled } from './is-capability-enabled';

const READER_ACCOUNT_CAPABILITIES = [
  CAPABILITY.BOOKMARKS,
  CAPABILITY.COMMENTS,
  CAPABILITY.NEWSLETTER,
] as const;

export const isReaderAccountEnabled = async (
  tenant?: string,
): Promise<boolean> => {
  const enabled = await Promise.all(
    READER_ACCOUNT_CAPABILITIES.map((capability) =>
      isCapabilityEnabled(capability, tenant),
    ),
  );
  return enabled.some(Boolean);
};
