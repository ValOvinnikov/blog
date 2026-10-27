import { faker } from '@faker-js/faker';
import { customRender, screen } from '@platform/testing/custom-render';
import { MOCK_TENANT_URL } from '@platform/testing/tenants/fixtures';

import { ExternalLink } from './external-link';

faker.seed(5995);

const MOCK_LINK_TEXT = faker.lorem.word();

const setup = customRender(ExternalLink, {
  href: MOCK_TENANT_URL,
  children: MOCK_LINK_TEXT,
});

describe(`<${ExternalLink.name}/>`, () => {
  it('opens in a new tab safely and announces that it does', () => {
    setup();

    const link = screen.getByRole('link', {
      name: `${MOCK_LINK_TEXT} (opens in new tab)`,
    });

    expect(link).toHaveAttribute('href', MOCK_TENANT_URL);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
