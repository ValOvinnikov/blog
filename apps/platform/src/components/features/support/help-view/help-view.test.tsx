import { faker } from '@faker-js/faker';
import messages from '@platform/i18n/messages/en.json';
import { customRender, screen } from '@platform/testing/custom-render';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';

import { HelpView } from './help-view';

vi.mock('@platform/server/support/send-support-message-action');

faker.seed(7184);

const { helpView, helpForm } = messages;
const MOCK_HELP_CENTRE_URL = faker.internet.url();
const HELP_CENTRE_LINK = { name: new RegExp(helpView.helpCentre) };
const SEND_BUTTON = { name: helpForm.send };

const setup = customRender(HelpView, {
  tenantId: MOCK_TENANT_ID,
  isFormAvailable: true,
});

describe(`<${HelpView.name}/>`, () => {
  describe('when support can be reached', () => {
    beforeEach(() => {
      setup();
    });

    it('offers the form', () => {
      const sendButton = screen.getByRole('button', SEND_BUTTON);
      const unavailable = screen.queryByText(helpView.unavailableTitle);

      expect(sendButton).toBeVisible();
      expect(unavailable).not.toBeInTheDocument();
    });

    it('shows no help-centre link without an address', () => {
      const link = screen.queryByRole('link', HELP_CENTRE_LINK);

      expect(link).not.toBeInTheDocument();
    });
  });

  it('says the form is unavailable and hides it when support cannot be reached', () => {
    setup({ isFormAvailable: false });

    const unavailable = screen.getByText(helpView.unavailableTitle);
    const sendButton = screen.queryByRole('button', SEND_BUTTON);

    expect(unavailable).toBeVisible();
    expect(sendButton).not.toBeInTheDocument();
  });

  it('links to the help centre when its address is configured', () => {
    setup({ helpCentreUrl: MOCK_HELP_CENTRE_URL });

    const link = screen.getByRole('link', HELP_CENTRE_LINK);

    expect(link).toHaveAttribute('href', MOCK_HELP_CENTRE_URL);
  });
});
