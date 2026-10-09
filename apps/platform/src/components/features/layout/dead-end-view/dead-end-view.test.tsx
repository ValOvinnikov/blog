import { renderWithIntl, screen } from '@platform/testing/custom-render';

import { DeadEndView } from './dead-end-view';

describe(DeadEndView, () => {
  it('renders the title as the page heading with its description and action', () => {
    renderWithIntl(
      <DeadEndView
        title="Page not found"
        description="This page doesn't exist."
        action={<button type="button">Go back</button>}
      />,
    );

    expect(
      screen.getByRole('heading', { level: 1, name: 'Page not found' }),
    ).toBeVisible();
    expect(screen.getByText("This page doesn't exist.")).toBeVisible();
    expect(screen.getByRole('button', { name: 'Go back' })).toBeVisible();
  });
});
