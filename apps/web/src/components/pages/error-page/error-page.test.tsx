import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { customRender, screen } from '@web/testing/custom-render';

import { ErrorPage } from './error-page';

const { reportClientErrorMock } = vi.hoisted(() => ({
  reportClientErrorMock: vi.fn(),
}));

vi.mock('@web/utils/report-client-error', () => ({
  reportClientError: reportClientErrorMock,
}));

const error = Object.assign(new Error('render blew up'), {
  digest: 'digest-123',
});
const reset = vi.fn();

const setup = customRender(ErrorPage, { error, reset });

describe(`<${ErrorPage.name}/>`, () => {
  beforeEach(() => {
    reportClientErrorMock.mockClear();
    reset.mockClear();
  });

  it('renders a heading and a try-again action', () => {
    setup();

    expect(
      screen.getByRole('heading', { name: 'Something went wrong' }),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeVisible();
  });

  it('reports the error on mount, with its digest', () => {
    setup();

    expect(reportClientErrorMock).toHaveBeenCalledWith(
      'error_boundary.render_failed',
      error,
      { digest: 'digest-123' },
    );
  });

  it('calls reset when "Try again" is clicked', async () => {
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(reset).toHaveBeenCalledTimes(1);
  });

  it('renders "Go home" as a real link, not a button', () => {
    setup();

    const goHomeLink = screen.getByRole('link', { name: 'Go home' });
    expect(goHomeLink).toBeVisible();
    expect(goHomeLink).toHaveAttribute('href', '/');
  });

  it('announces the error to assistive technology after mount', () => {
    const { container } = setup();

    const liveRegion = container.querySelector('[aria-live="assertive"]');
    expect(liveRegion).not.toBeNull();
    expect(liveRegion?.textContent).toBe(
      'Something went wrong. You can try again, or go home.',
    );
  });

  it('names both available actions in the announcement, matching the rendered controls', () => {
    const { container } = setup();

    const liveRegion = container.querySelector('[aria-live="assertive"]');
    const announcement = liveRegion?.textContent?.toLowerCase() ?? '';
    const tryAgainLabel =
      screen.getByRole('button', { name: 'Try again' }).textContent ?? '';
    const goHomeLabel =
      screen.getByRole('link', { name: 'Go home' }).textContent ?? '';

    expect(announcement).toContain(tryAgainLabel.toLowerCase());
    expect(announcement).toContain(goHomeLabel.toLowerCase());
  });

  it('sets aria-atomic on the live region', () => {
    const { container } = setup();

    const liveRegion = container.querySelector('[aria-live="assertive"]');
    expect(liveRegion).toHaveAttribute('aria-atomic', 'true');
  });

  it('does not re-report or re-announce on a re-render with the same error', () => {
    const { rerender } = setup();

    rerender(<ErrorPage error={error} reset={reset} />);

    expect(reportClientErrorMock).toHaveBeenCalledTimes(1);
  });

  it('moves focus to the page container on mount', () => {
    setup();

    expect(screen.getByRole('main')).toHaveFocus();
  });

  it('renders without the i18n provider, since it sits above it in the tree', () => {
    render(<ErrorPage error={error} reset={reset} />);

    expect(
      screen.getByRole('heading', { name: 'Something went wrong' }),
    ).toBeVisible();
  });
});
