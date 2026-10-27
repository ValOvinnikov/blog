import { SITE_MESSAGES } from '@blog/config';
import userEvent from '@testing-library/user-event';
import { customRender, screen } from '@web/testing/custom-render';
import { MOCK_ERROR_WITH_DIGEST } from '@web/testing/shared/error/fixtures';
import { reportClientError } from '@web/utils/report-client-error';

import ErrorBoundary from './error';

vi.mock('@web/utils/report-client-error');

const { title: TITLE, retry: RETRY } = SITE_MESSAGES.localeErrorPage;

const reset = vi.fn();

const setup = customRender(ErrorBoundary, {
  error: MOCK_ERROR_WITH_DIGEST,
  reset,
});

describe(`<${ErrorBoundary.name}/>`, () => {
  beforeEach(() => {
    setup();
  });

  it('renders the locale error page for the error', () => {
    const heading = screen.getByRole('heading', { level: 1, name: TITLE });

    expect(heading).toBeVisible();
    expect(reportClientError).toHaveBeenCalledTimes(1);
  });

  it('retries through the reset it was given', async () => {
    const user = userEvent.setup();
    const retryButton = screen.getByRole('button', { name: RETRY });

    await user.click(retryButton);

    expect(reset).toHaveBeenCalledTimes(1);
  });
});
