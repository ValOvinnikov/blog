import { faker } from '@faker-js/faker';
import messages from '@platform/i18n/messages/en.json';
import { customRender, screen } from '@platform/testing/custom-render';
import {
  MOCK_TENANT_DOMAIN,
  MOCK_TENANT_NAME,
  MOCK_TENANT_URL,
} from '@platform/testing/tenants/fixtures';

import { ExternalLinkButton } from './external-link-button';

faker.seed(5995);

const MOCK_LINK_TEXT = faker.lorem.words(2);
const MOCK_OPEN_TENANT_SITE = `Open ${MOCK_TENANT_NAME}'s site`;
const MOCK_OPEN_TENANT_IN_NEW_TAB = `Open ${MOCK_TENANT_DOMAIN} in a new tab`;

const setup = customRender(ExternalLinkButton, {
  href: MOCK_TENANT_URL,
  children: MOCK_LINK_TEXT,
});

describe(`<${ExternalLinkButton.name}/>`, () => {
  it('links out with the new-tab hint in its accessible name', () => {
    setup();

    const link = screen.getByRole('link', {
      name: `${MOCK_LINK_TEXT} ${messages.externalLink.newTabHint}`,
    });

    expect(link).toHaveAttribute('href', MOCK_TENANT_URL);
  });

  it('applies the given aria label as the accessible name', () => {
    setup({ ariaLabel: MOCK_OPEN_TENANT_SITE });

    const link = screen.getByRole('link', { name: MOCK_OPEN_TENANT_SITE });

    expect(link).toHaveAttribute('href', MOCK_TENANT_URL);
  });

  it('applies the given title alongside an icon-only aria label', () => {
    setup({
      children: undefined,
      ariaLabel: MOCK_OPEN_TENANT_IN_NEW_TAB,
      title: MOCK_OPEN_TENANT_IN_NEW_TAB,
    });

    const link = screen.getByRole('link', {
      name: MOCK_OPEN_TENANT_IN_NEW_TAB,
    });

    expect(link).toHaveAttribute('title', MOCK_OPEN_TENANT_IN_NEW_TAB);
  });
});
