import { errorResult, okResult } from '@shinefold/utils';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { logger } from '@web/utils/logger/logger';
import type { Metadata } from 'next';
import type { Mock } from 'vitest';

interface IMetadataLoaderContractOptions {
  pageLoaderMock: Mock;
  buildMetadata: () => Promise<Metadata>;
  logEvent: string;
  logContext?: Record<string, unknown>;
}

export const testMetadataLoaderFailures = ({
  pageLoaderMock,
  buildMetadata,
  logEvent,
  logContext = {},
}: IMetadataLoaderContractOptions) => {
  describe('when no metadata can be built', () => {
    it('returns empty metadata and logs when the page fetch fails', async () => {
      pageLoaderMock.mockResolvedValue(errorResult(MOCK_ERROR));

      const metadata = await buildMetadata();

      expect(metadata).toEqual({});
      expect(vi.mocked(logger.error)).toHaveBeenCalledWith(logEvent, {
        ...logContext,
        error: MOCK_ERROR,
      });
    });

    it('returns empty metadata without logging when the page does not exist', async () => {
      pageLoaderMock.mockResolvedValue(okResult());

      const metadata = await buildMetadata();

      expect(metadata).toEqual({});
      expect(vi.mocked(logger.error)).not.toHaveBeenCalled();
    });
  });
};
