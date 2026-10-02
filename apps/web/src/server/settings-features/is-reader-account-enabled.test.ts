import { CAPABILITY, type TCapability } from '@blog/config';

import { isCapabilityEnabled } from './is-capability-enabled';
import { isReaderAccountEnabled } from './is-reader-account-enabled';

vi.mock('./is-capability-enabled', () => ({
  isCapabilityEnabled: vi.fn(),
}));

const isCapabilityEnabledMock = vi.mocked(isCapabilityEnabled);

const enableOnly = (...capabilities: TCapability[]) =>
  isCapabilityEnabledMock.mockImplementation(async (capability) =>
    capabilities.includes(capability),
  );

describe(isReaderAccountEnabled, () => {
  beforeEach(() => {
    isCapabilityEnabledMock.mockReset();
  });

  it.each([CAPABILITY.BOOKMARKS, CAPABILITY.COMMENTS, CAPABILITY.NEWSLETTER])(
    'is enabled when %s is the only reader-account capability enabled',
    async (capability) => {
      enableOnly(capability);

      await expect(isReaderAccountEnabled('tenant-1')).resolves.toBe(true);
    },
  );

  it('is disabled when only capabilities that need no reader account are enabled', async () => {
    enableOnly(
      CAPABILITY.RATINGS,
      CAPABILITY.ANALYTICS,
      CAPABILITY.CONSENT_BANNER,
    );

    await expect(isReaderAccountEnabled('tenant-1')).resolves.toBe(false);
  });

  it('checks each capability against the supplied tenant', async () => {
    enableOnly();

    await isReaderAccountEnabled('tenant-1');

    expect(isCapabilityEnabledMock).toHaveBeenCalledWith(
      CAPABILITY.BOOKMARKS,
      'tenant-1',
    );
  });
});
