import {
  renderWithIntl,
  screen,
  within,
} from '@platform/testing/custom-render';

import { PreShellFrame } from './pre-shell-frame';

describe(PreShellFrame, () => {
  it('renders its content inside a single main landmark', () => {
    renderWithIntl(
      <PreShellFrame>
        <h1>Page title</h1>
      </PreShellFrame>,
    );

    expect(
      within(screen.getByRole('main')).getByRole('heading', {
        name: 'Page title',
      }),
    ).toBeVisible();
  });
});
