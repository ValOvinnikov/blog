import { customRender, screen } from '@web/testing/custom-render';
import { makePrivacySection } from '@web/testing/pages/account-page/privacy-section-fixtures';

import { PrivacySection } from './privacy-section';

vi.mock('@web/components/shared/smart-link', () => ({
  SmartLink: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock('@web/components/shared/delete-account-control', () => ({
  DeleteAccountControl: ({ handle }: { handle: string }) => (
    <div data-testid="delete-account-control">{handle}</div>
  ),
}));

const setup = customRender(PrivacySection, makePrivacySection());

describe(PrivacySection, () => {
  it('renders the panel heading as a level-2 heading', () => {
    setup();

    expect(
      screen.getByRole('heading', { level: 2, name: 'Privacy' }),
    ).toBeVisible();
  });

  it('renders the export-my-data row as a download link to the export route', () => {
    setup();

    const exportLink = screen.getByRole('link', { name: 'Request export' });
    expect(exportLink).toHaveAttribute('href', '/api/account/export');
    expect(exportLink).toHaveAttribute('download');
  });

  it('renders the delete-account row with the given handle passed to the control', () => {
    setup();

    expect(screen.getByText('Delete account')).toBeVisible();
    expect(screen.getByTestId('delete-account-control')).toHaveTextContent(
      'jane',
    );
  });
});
