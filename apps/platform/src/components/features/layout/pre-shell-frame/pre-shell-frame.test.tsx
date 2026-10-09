import {
  renderWithIntl,
  screen,
  within,
} from '@platform/testing/custom-render';

import { PreShellFrame } from './pre-shell-frame';

describe(PreShellFrame, () => {
  it('renders its header and content inside a single main landmark', () => {
    renderWithIntl(
      <PreShellFrame header={<h1>Page title</h1>}>
        <p>Page content</p>
      </PreShellFrame>,
    );

    const main = screen.getByRole('main');
    expect(
      within(main).getByRole('heading', { name: 'Page title' }),
    ).toBeVisible();
    expect(within(main).getByText('Page content')).toBeVisible();
  });
});
