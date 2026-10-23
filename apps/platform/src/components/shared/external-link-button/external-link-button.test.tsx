import { SIZE } from '@blog/config';
import { renderWithIntl, screen } from '@platform/testing/custom-render';
import {
  MOCK_TENANT_DOMAIN,
  MOCK_TENANT_URL,
} from '@platform/testing/tenants/fixtures';

import { ExternalLinkButton } from './external-link-button';

const OPEN_TENANT_IN_NEW_TAB = `Open ${MOCK_TENANT_DOMAIN} in a new tab`;

describe(`<${ExternalLinkButton.name}/>`, () => {
  it('renders as an anchor opening in a new tab safely, announcing the new-tab hint', () => {
    renderWithIntl(
      <ExternalLinkButton href={MOCK_TENANT_URL}>Open site</ExternalLinkButton>,
    );

    const link = screen.getByRole('link', {
      name: 'Open site (opens in new tab)',
    });
    expect(link).toHaveAttribute('href', MOCK_TENANT_URL);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders every variant and size without throwing', () => {
    const variants = ['primary', 'secondary', 'ghost', 'danger'] as const;
    const sizes = [SIZE.SM, SIZE.MD] as const;

    variants.forEach((variant) => {
      sizes.forEach((size) => {
        expect(() =>
          renderWithIntl(
            <ExternalLinkButton
              href={MOCK_TENANT_URL}
              variant={variant}
              size={size}
            >
              Open site
            </ExternalLinkButton>,
          ),
        ).not.toThrow();
      });
    });
  });

  it('applies the given ariaLabel as the accessible name', () => {
    renderWithIntl(
      <ExternalLinkButton
        href={MOCK_TENANT_URL}
        ariaLabel="Open Acme Inc.'s site"
      >
        Open site
      </ExternalLinkButton>,
    );

    expect(
      screen.getByRole('link', { name: "Open Acme Inc.'s site" }),
    ).toHaveAttribute('href', MOCK_TENANT_URL);
  });

  it('applies the given title attribute alongside an icon-only ariaLabel', () => {
    renderWithIntl(
      <ExternalLinkButton
        href={MOCK_TENANT_URL}
        ariaLabel={OPEN_TENANT_IN_NEW_TAB}
        title={OPEN_TENANT_IN_NEW_TAB}
      />,
    );

    expect(
      screen.getByRole('link', { name: OPEN_TENANT_IN_NEW_TAB }),
    ).toHaveAttribute('title', OPEN_TENANT_IN_NEW_TAB);
  });
});
