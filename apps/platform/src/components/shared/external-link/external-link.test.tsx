import { renderWithIntl, screen } from '@platform/testing/custom-render';
import { MOCK_TENANT_URL } from '@platform/testing/tenants/fixtures';

import { ExternalLink } from './external-link';

describe(`<${ExternalLink.name}/>`, () => {
  it('opens in a new tab safely and announces that it does', () => {
    renderWithIntl(<ExternalLink href={MOCK_TENANT_URL}>Terms</ExternalLink>);

    const link = screen.getByRole('link', {
      name: 'Terms (opens in new tab)',
    });

    expect(link).toHaveAttribute('href', MOCK_TENANT_URL);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
