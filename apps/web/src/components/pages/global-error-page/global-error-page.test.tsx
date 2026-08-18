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
      'global_error_boundary.render_failed',
      error,
      { digest: 'digest-456' },
    );
  });

  it('calls reset when "Try again" is clicked', async () => {
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(reset).toHaveBeenCalledTimes(1);
  });
});
