import { renderWithIntl, screen } from '@admin/testing/custom-render';

import { UnauthorizedView } from './unauthorized-view';

describe(UnauthorizedView, () => {
  it('renders the heading and description from the messages file', () => {
    renderWithIntl(<UnauthorizedView />);

    expect(
      screen.getByRole('heading', { name: 'Not authorized' }),
    ).toBeVisible();
    expect(
      screen.getByText(
        'Your account does not have access to this application.',
      ),
    ).toBeVisible();
  });
});
