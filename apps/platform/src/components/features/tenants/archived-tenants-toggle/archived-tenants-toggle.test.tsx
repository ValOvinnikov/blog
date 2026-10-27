import { useRouter } from '@platform/i18n/navigation';
import { customRender, screen } from '@platform/testing/custom-render';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { ArchivedTenantsToggle } from './archived-tenants-toggle';

vi.mock('@platform/i18n/navigation');

const ACTIVE_LABEL = 'Active';
const ALL_LABEL = 'All';
const ARIA_PRESSED = 'aria-pressed';

const setup = customRender(ArchivedTenantsToggle, {
  shouldShowArchived: false,
});

describe(`<${ArchivedTenantsToggle.name}/>`, () => {
  let user: UserEvent;
  const push = vi.fn();

  beforeEach(() => {
    user = userEvent.setup();
    vi.mocked(useRouter).mockReturnValue({ ...useRouter(), push });
  });

  it('shows Active selected by default', () => {
    setup();

    const activeButton = screen.getByRole('button', { name: ACTIVE_LABEL });

    expect(activeButton).toHaveAttribute(ARIA_PRESSED, 'true');
  });

  it('shows All selected when archived tenants are shown', () => {
    setup({ shouldShowArchived: true });

    const allButton = screen.getByRole('button', { name: ALL_LABEL });

    expect(allButton).toHaveAttribute(ARIA_PRESSED, 'true');
  });

  it('navigates to the archived tenant list when All is selected', async () => {
    setup();

    const allButton = screen.getByRole('button', { name: ALL_LABEL });
    await user.click(allButton);

    expect(push).toHaveBeenCalledWith('/tenants?archived=1');
  });

  it('navigates back to the active-only list when Active is selected', async () => {
    setup({ shouldShowArchived: true });

    const activeButton = screen.getByRole('button', { name: ACTIVE_LABEL });
    await user.click(activeButton);

    expect(push).toHaveBeenCalledWith('/tenants');
  });
});
