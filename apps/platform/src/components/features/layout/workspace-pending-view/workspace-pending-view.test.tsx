import { renderWithIntl, screen } from '@platform/testing/custom-render';

import { WorkspacePendingView } from './workspace-pending-view';

describe(WorkspacePendingView, () => {
  it('renders the heading and description from the messages file', () => {
    renderWithIntl(<WorkspacePendingView />);

    expect(
      screen.getByRole('heading', { name: "Your workspace isn't ready yet" }),
    ).toBeVisible();
    expect(
      screen.getByText(
        'This can happen while a workspace is being set up, or if something went wrong along the way. Try refreshing in a few minutes, or contact whoever invited you if it keeps happening.',
      ),
    ).toBeVisible();
  });
});
