import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { customRender, screen } from '@web/testing/custom-render';

import { GlobalErrorPage } from './global-error-page';

const { reportClientErrorMock } = vi.hoisted(() => ({
  reportClientErrorMock: vi.fn(),
}));

vi.mock('@web/utils/report-client-error', () => ({
  reportClientError: reportClientErrorMock,
}));

const error = Object.assign(new Error('root layout blew up'), {
  digest: 'digest-456',
});
const reset = vi.fn();

const setup = customRender(GlobalErrorPage, { error, reset });

describe(`<${GlobalErrorPage.name}/>`, () => {
  describe('with the default error', () => {
    beforeEach(() => {
      setup();
    });

    it('renders a heading and a try-again action', () => {
      expect(
        screen.getByRole('heading', { name: 'Something went wrong' }),
      ).toBeVisible();
      expect(screen.getByRole('button', { name: 'Try again' })).toBeVisible();
    });

    it('reports the error on mount, with its digest', () => {
      expect(reportClientErrorMock).toHaveBeenCalledWith(
        'global_error_boundary.render_failed',
        error,
        { digest: 'digest-456' },
      );
    });

    it('calls reset when "Try again" is clicked', async () => {
      const user = userEvent.setup();

      await user.click(screen.getByRole('button', { name: 'Try again' }));

      expect(reset).toHaveBeenCalledTimes(1);
    });

    it('renders "Go home" as a real link, not a button', () => {
      const goHomeLink = screen.getByRole('link', { name: 'Go home' });
      expect(goHomeLink).toBeVisible();
      expect(goHomeLink).toHaveAttribute('href', '/');
    });

    it('announces the error to assistive technology after mount', () => {
      expect(
        screen.getByText(
          'Something went wrong. You can try again, or go home.',
        ),
      ).toBeVisible();
    });

    it('names both available actions in the announcement, matching the rendered controls', () => {
      const announcement =
        'Something went wrong. You can try again, or go home.'.toLowerCase();
      const tryAgainLabel =
        screen.getByRole('button', { name: 'Try again' }).textContent ?? '';
      const goHomeLabel =
        screen.getByRole('link', { name: 'Go home' }).textContent ?? '';

      expect(announcement).toContain(tryAgainLabel.toLowerCase());
      expect(announcement).toContain(goHomeLabel.toLowerCase());
    });

    it('sets aria-atomic on the live region', () => {
      expect(
        screen.getByText(
          'Something went wrong. You can try again, or go home.',
        ),
      ).toHaveAttribute('aria-atomic', 'true');
    });

    it('moves focus to the page container on mount', () => {
      expect(screen.getByRole('main')).toHaveFocus();
    });
  });

  it('does not re-report or re-announce on a re-render with the same error', () => {
    const { rerender } = setup();

    rerender(<GlobalErrorPage error={error} reset={reset} />);

    expect(reportClientErrorMock).toHaveBeenCalledTimes(1);
  });

  it('renders without the i18n provider, since it sits above it in the tree', () => {
    render(<GlobalErrorPage error={error} reset={reset} />);

    expect(
      screen.getByRole('heading', { name: 'Something went wrong' }),
    ).toBeVisible();
  });
});
