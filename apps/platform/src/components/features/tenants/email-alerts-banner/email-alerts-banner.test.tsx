import { customRender, screen } from '@platform/testing/custom-render';

import { EmailAlertsBanner } from './email-alerts-banner';

const setup = customRender(EmailAlertsBanner, {});

describe(`<${EmailAlertsBanner.name}/>`, () => {
  it('warns operators that email alerts are not configured', () => {
    setup();

    const banner = screen.getByRole('status');
    const title = screen.getByText('Email alerts not configured');
    const description = screen.getByText(
      "RESEND_API_KEY isn't set, so operators won't be emailed when a tenant needs attention — check this page manually.",
    );

    expect(banner).toBeVisible();
    expect(title).toBeVisible();
    expect(description).toBeVisible();
  });
});
