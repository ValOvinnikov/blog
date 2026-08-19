import { renderWithIntl, screen } from '@admin/testing/custom-render';
import userEvent from '@testing-library/user-event';

import { ArchivedTenantsToggle } from './archived-tenants-toggle';

const render = renderWithIntl;

const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }));

vi.mock('@admin/i18n/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

describe(ArchivedTenantsToggle, () => {
  beforeEach(() => {
    pushMock.mockReset();
  });

  it('shows Active selected by default', () => {
    render(<ArchivedTenantsToggle shouldShowArchived={false} />);

    expect(screen.getByRole('radio', { name: 'Active' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });

  it('shows All selected when shouldShowArchived is true', () => {
    render(<ArchivedTenantsToggle shouldShowArchived={true} />);

    expect(screen.getByRole('radio', { name: 'All' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });

  it('navigates to the archived tenant list when All is selected', async () => {
    const user = userEvent.setup();
    render(<ArchivedTenantsToggle shouldShowArchived={false} />);

    await user.click(screen.getByRole('radio', { name: 'All' }));

    expect(pushMock).toHaveBeenCalledWith('/tenants?archived=1');
  });

  it('navigates back to the active-only list when Active is selected', async () => {
    const user = userEvent.setup();
    render(<ArchivedTenantsToggle shouldShowArchived={true} />);

    await user.click(screen.getByRole('radio', { name: 'Active' }));

    expect(pushMock).toHaveBeenCalledWith('/tenants');
  });
});
