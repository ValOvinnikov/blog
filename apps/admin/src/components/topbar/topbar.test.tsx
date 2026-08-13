import { render, screen } from '@testing-library/react';

import { Topbar } from './topbar';

describe(Topbar, () => {
  it('renders the crumb and role label', () => {
    render(<Topbar crumb="Platform" roleLabel="ADMIN" />);

    expect(screen.getByText('Platform')).toBeVisible();
    expect(screen.getByText('ADMIN')).toBeVisible();
  });
});
