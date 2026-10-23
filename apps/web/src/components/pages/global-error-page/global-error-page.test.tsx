import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { customRender, screen } from '@web/testing/custom-render';
import {
  MOCK_ERROR_DIGEST,
  MOCK_ERROR_WITH_DIGEST,
} from '@web/testing/shared/error/fixtures';

import { GlobalErrorPage } from './global-error-page';

const { reportClientErrorMock } = vi.hoisted(() => ({
  reportClientErrorMock: vi.fn(),
}));

vi.mock('@web/utils/report-client-error', () => ({
  reportClientError: reportClientErrorMock,
}));

const HEADING = 'Something went wrong';
const ANNOUNCEMENT = 'Something went wrong. You can try again, or go home.';
const TRY_AGAIN = 'Try again';
const GO_HOME = 'Go home';

const error = MOCK_ERROR_WITH_DIGEST;
const reset = vi.fn();

const setup = customRender(GlobalErrorPage, { error, reset });

describe(`<${GlobalErrorPage.name}/>`, () => {
  describe('with the default error', () => {
    beforeEach(() => {
      setup();
    });

    it('renders a heading and a try-again action', () => {
      const heading = screen.getByRole('heading', { name: HEADING });
      const tryAgainButton = screen.getByRole('button', { name: TRY_AGAIN });

      expect(heading).toBeVisible();
      expect(tryAgainButton).toBeVisible();
    });

    it('reports the error on mount, with its digest', () => {
      expect(reportClientErrorMock).toHaveBeenCalledWith(
        'global_error_boundary.render_failed',
        error,
        { digest: MOCK_ERROR_DIGEST },
      );
    });

    it('calls reset when "Try again" is clicked', async () => {
      const user = userEvent.setup();
      const tryAgainButton = screen.getByRole('button', { name: TRY_AGAIN });

      await user.click(tryAgainButton);

      expect(reset).toHaveBeenCalledTimes(1);
    });

    it('renders "Go home" as a real link, not a button', () => {
      const goHomeLink = screen.getByRole('link', { name: GO_HOME });

      expect(goHomeLink).toBeVisible();
      expect(goHomeLink).toHaveAttribute('href', '/');
    });

    it('announces the error to assistive technology after mount', () => {
      const liveRegion = screen.getByText(ANNOUNCEMENT);

      expect(liveRegion).toBeVisible();
    });

    it('names both actions in the announcement as the controls render them', () => {
      const tryAgainLabel =
        screen.getByRole('button', { name: TRY_AGAIN }).textContent ?? '';
      const goHomeLabel =
        screen.getByRole('link', { name: GO_HOME }).textContent ?? '';

      expect(ANNOUNCEMENT.toLowerCase()).toContain(tryAgainLabel.toLowerCase());
      expect(ANNOUNCEMENT.toLowerCase()).toContain(goHomeLabel.toLowerCase());
    });

    it('sets aria-atomic on the live region', () => {
      const liveRegion = screen.getByText(ANNOUNCEMENT);

      expect(liveRegion).toHaveAttribute('aria-atomic', 'true');
    });

    it('moves focus to the page container on mount', () => {
      const main = screen.getByRole('main');

      expect(main).toHaveFocus();
    });
  });

  it('does not re-report or re-announce on a re-render with the same error', () => {
    const { rerender } = setup();

    rerender(<GlobalErrorPage error={error} reset={reset} />);

    expect(reportClientErrorMock).toHaveBeenCalledTimes(1);
  });

  it('renders without the i18n provider, since it sits above it in the tree', () => {
    render(<GlobalErrorPage error={error} reset={reset} />);

    const heading = screen.getByRole('heading', { name: HEADING });

    expect(heading).toBeVisible();
  });
});
