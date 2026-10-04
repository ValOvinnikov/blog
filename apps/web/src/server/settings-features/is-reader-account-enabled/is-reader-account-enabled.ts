import { CAPABILITY } from '@blog/config';
import { isCapabilityEnabled } from '@web/server/settings-features/is-capability-enabled/is-capability-enabled';

const READER_ACCOUNT_CAPABILITIES = [
  CAPABILITY.BOOKMARKS,
  CAPABILITY.COMMENTS,
  CAPABILITY.NEWSLETTER,
] as const;

export const isReaderAccountEnabled = async (): Promise<boolean> => {
  const enabled = await Promise.all(
    READER_ACCOUNT_CAPABILITIES.map((capability) =>
      isCapabilityEnabled(capability),
    ),
  );
  return enabled.some(Boolean);
};
