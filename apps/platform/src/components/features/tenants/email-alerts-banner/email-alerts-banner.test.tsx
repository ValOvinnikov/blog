import { renderWithIntl, screen } from '@platform/testing/custom-render';

import { EmailAlertsBanner } from './email-alerts-banner';

describe(EmailAlertsBanner, () => {
  it('renders a status-role warning that email alerts are unconfigured', () => {
    renderWithIntl(<EmailAlertsBanner />);

    expect(screen.getByRole('status')).toBeVisible();
    expect(screen.getByText('Email alerts not configured')).toBeVisible();
    expect(
      screen.getByText(
        "RESEND_API_KEY isn't set, so operators won't be emailed when a tenant needs attention — check this page manually.",
      ),
    ).toBeVisible();
  });
});
