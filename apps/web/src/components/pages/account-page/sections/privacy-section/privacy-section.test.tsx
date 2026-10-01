import userEvent from '@testing-library/user-event';
import { ToastProvider } from '@web/context/toast-provider';
import { renderElement, screen } from '@web/testing/custom-render';
import { makePrivacySection } from '@web/testing/pages/account-page/privacy-section-fixtures';

import { PrivacySection } from './privacy-section';

vi.mock('@web/i18n/navigation');

vi.mock('@web/server/auth/auth', () => ({ auth: vi.fn() }));

vi.mock('@web/utils/logger/logger');

const setup = () =>
  renderElement(
    <ToastProvider>
      <PrivacySection {...makePrivacySection()} />
    </ToastProvider>,
  );

describe(`<${PrivacySection.name}/>`, () => {
  it('renders the panel heading as a level-2 heading', () => {
    setup();

    expect(
      screen.getByRole('heading', { level: 2, name: 'Privacy' }),
    ).toBeVisible();
  });

  it('renders the export row as a download link to the export route', () => {
    setup();

    const exportLink = screen.getByRole('link', { name: 'Request export' });
    expect(exportLink).toHaveAttribute('href', '/api/account/export');
    expect(exportLink).toHaveAttribute('download');
  });

  it('arms the delete button once the handle is typed', async () => {
    const user = userEvent.setup();
    setup();

    const deleteButton = screen.getByRole('button', { name: 'Delete account' });
    expect(deleteButton).toBeDisabled();

    await user.type(
      screen.getByRole('textbox', {
        name: 'Type your handle to confirm deletion',
      }),
      'jane',
    );

    expect(deleteButton).toBeEnabled();
  });
});
