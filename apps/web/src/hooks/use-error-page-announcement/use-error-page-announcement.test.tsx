import { faker } from '@faker-js/faker';
import { ERROR_BOUNDARY_LOG } from '@web/constants/error-boundary';
import { renderHook } from '@web/testing/custom-render';
import { MOCK_ERROR_WITH_DIGEST } from '@web/testing/shared/error/fixtures';
import { reportClientError } from '@web/utils/report-client-error';

import { useErrorPageAnnouncement } from './use-error-page-announcement';

vi.mock('@web/utils/report-client-error');

faker.seed(8152);

const MOCK_ANNOUNCEMENT = faker.lorem.sentence();
const MOCK_REFRESHED_ANNOUNCEMENT = faker.lorem.sentence();
const MOCK_NEXT_ERROR = new Error(faker.lorem.sentence());

const setup = () =>
  renderHook(
    ({ error, announcement }) =>
      useErrorPageAnnouncement({
        error,
        logEvent: ERROR_BOUNDARY_LOG.LOCALE_RENDER_FAILED,
        announcement,
      }),
    {
      initialProps: {
        error: MOCK_ERROR_WITH_DIGEST,
        announcement: MOCK_ANNOUNCEMENT,
      },
    },
  );

describe(useErrorPageAnnouncement, () => {
  let rerender: ReturnType<typeof setup>['rerender'];

  beforeEach(() => {
    ({ rerender } = setup());
  });

  it('does not re-report when the announcement changes but the error is the same', () => {
    rerender({
      error: MOCK_ERROR_WITH_DIGEST,
      announcement: MOCK_REFRESHED_ANNOUNCEMENT,
    });

    expect(vi.mocked(reportClientError)).toHaveBeenCalledTimes(1);
  });

  it('reports again when a different error arrives', () => {
    rerender({ error: MOCK_NEXT_ERROR, announcement: MOCK_ANNOUNCEMENT });

    expect(vi.mocked(reportClientError)).toHaveBeenLastCalledWith(
      ERROR_BOUNDARY_LOG.LOCALE_RENDER_FAILED,
      MOCK_NEXT_ERROR,
      { digest: undefined },
    );
    expect(vi.mocked(reportClientError)).toHaveBeenCalledTimes(2);
  });
});
