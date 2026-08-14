import { customRenderAsync, screen } from '@admin/testing/custom-render';

import UnauthorizedPage from './page';

const setup = customRenderAsync(UnauthorizedPage, {});

describe(UnauthorizedPage, () => {
  it('renders the heading and description from the messages file', async () => {
    await setup();

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
