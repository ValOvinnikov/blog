import userEvent from '@testing-library/user-event';
import { ToastProvider } from '@web/context/toast-provider';
import { renderElement, screen } from '@web/testing/custom-render';
import { mockPrivacySection } from '@web/testing/pages/account-page/privacy-section-fixtures';

import { PrivacySection } from './privacy-section';

vi.mock('@web/i18n/navigation');

vi.mock('@web/server/auth/auth', () => ({ auth: vi.fn() }));

const setup = () =>
  renderElement(
    <ToastProvider>
      <PrivacySection {...mockPrivacySection()} />
    </ToastProvider>,
  );

describe(`<${PrivacySection.name}/>`, () => {
  beforeEach(() => {
    setup();
  });

  it('renders the panel heading as a level-2 heading', () => {
    const privacyHeading = screen.getByRole('heading', {
      level: 2,
      name: 'Privacy',
    });

    expect(privacyHeading).toBeVisible();
  });

  it('renders the export row as a download link to the export route', () => {
    const exportLink = screen.getByRole('link', { name: 'Request export' });
    expect(exportLink).toHaveAttribute('href', '/api/account/export');
    expect(exportLink).toHaveAttribute('download');
  });

  it('arms the delete button once the handle is typed', async () => {
    const user = userEvent.setup();
    const deleteButton = screen.getByRole('button', { name: 'Delete account' });
    expect(deleteButton).toBeDisabled();

    const handleTextbox = screen.getByRole('textbox', {
      name: 'Type your handle to confirm deletion',
    });
    await user.type(handleTextbox, 'jane');

    expect(deleteButton).toBeEnabled();
  });
});
