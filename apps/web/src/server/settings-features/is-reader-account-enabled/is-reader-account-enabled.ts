import { READER_ACCOUNT_CAPABILITIES } from '@blog/config';
import { isCapabilityEnabled } from '@web/server/settings-features/is-capability-enabled/is-capability-enabled';

export const isReaderAccountEnabled = async (): Promise<boolean> => {
  const enabled = await Promise.all(
    READER_ACCOUNT_CAPABILITIES.map((capability) =>
      isCapabilityEnabled(capability),
    ),
  );
  return enabled.some(Boolean);
};
