import { SITE_MESSAGES } from '@shinefold/config';
import { ERROR_BOUNDARY_LOG } from '@web/constants/error-boundary';
import { render, screen } from '@web/testing/custom-render';
import { testErrorPageContract } from '@web/testing/pages/error-page/error-page-contract';
import { MOCK_ERROR_WITH_DIGEST } from '@web/testing/shared/error/fixtures';

import { GlobalErrorPage } from './global-error-page';

vi.mock('@web/utils/report-client-error');

const {
  title: HEADING,
  announcement,
  retry: tryAgain,
  goHome,
} = SITE_MESSAGES.localeErrorPage;

describe(`<${GlobalErrorPage.name}/>`, () => {
  testErrorPageContract({
    Page: GlobalErrorPage,
    logEvent: ERROR_BOUNDARY_LOG.GLOBAL_RENDER_FAILED,
    copy: { title: HEADING, tryAgain, goHome, announcement },
  });

  it('renders without the i18n provider, since it sits above it in the tree', () => {
    render(<GlobalErrorPage error={MOCK_ERROR_WITH_DIGEST} reset={vi.fn()} />);

    const heading = screen.getByRole('heading', { name: HEADING });

    expect(heading).toBeVisible();
  });
});
