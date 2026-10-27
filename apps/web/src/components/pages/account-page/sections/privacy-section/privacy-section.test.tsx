import { routes } from '@blog/config';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { ToastProvider } from '@web/context/toast-provider';
import { renderElement, screen } from '@web/testing/custom-render';
import { mockPrivacySection } from '@web/testing/pages/account-page/privacy-section-fixtures';

import { PrivacySection } from './privacy-section';

vi.mock('@web/i18n/navigation');

vi.mock('@web/server/auth/auth');

const MOCK_PROPS = mockPrivacySection();

const setup = () =>
  renderElement(
    <ToastProvider>
      <PrivacySection {...MOCK_PROPS} />
    </ToastProvider>,
  );

describe(`<${PrivacySection.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
    setup();
  });

  it('renders the panel heading as a level-2 heading', () => {
    const privacyHeading = screen.getByRole('heading', {
      level: 2,
      name: MOCK_PROPS.heading,
    });

    expect(privacyHeading).toBeVisible();
  });

  it('renders the export row as a download link to the export route', () => {
    const exportLink = screen.getByRole('link', {
      name: MOCK_PROPS.exportButton,
    });

    expect(exportLink).toHaveAttribute('href', routes.accountExport());
    expect(exportLink).toHaveAttribute('download');
  });

  it('arms the delete button once the handle is typed', async () => {
    const deleteButton = screen.getByRole('button', {
      name: MOCK_PROPS.deleteLabel,
    });
    const handleTextbox = screen.getByRole('textbox', {
      name: 'Type your handle to confirm deletion',
    });

    expect(deleteButton).toBeDisabled();

    await user.type(handleTextbox, MOCK_PROPS.handle);

    expect(deleteButton).toBeEnabled();
  });
});
