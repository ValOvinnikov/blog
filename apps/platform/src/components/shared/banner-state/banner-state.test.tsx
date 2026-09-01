import { render, screen } from '@testing-library/react';

import { BannerState } from './banner-state';

describe(BannerState, () => {
  it('renders the title, description, and action for a status tone', () => {
    render(
      <BannerState
        tone="ok"
        role="status"
        title="Provisioned"
        description="Everything is set up."
        action={<button type="button">View steps</button>}
      />,
    );

    expect(screen.getByRole('status')).toBeVisible();
    expect(screen.getByText('Provisioned')).toBeVisible();
    expect(screen.getByText('Everything is set up.')).toBeVisible();
    expect(screen.getByRole('button', { name: 'View steps' })).toBeVisible();
  });

  it('renders with an alert role for the bad tone', () => {
    render(
      <BannerState
        tone="bad"
        role="alert"
        title="Provisioning failed"
        description="Something went wrong."
        action={null}
      />,
    );

    expect(screen.getByRole('alert')).toBeVisible();
  });

  it('carries an id onto its root, so a disabled control elsewhere can point aria-describedby at it', () => {
    render(
      <BannerState
        id="archived-notice"
        tone="warn"
        role="status"
        title="This tenant is archived"
        description="Everything here is read-only."
        action={null}
      />,
    );

    expect(screen.getByRole('status')).toHaveAttribute('id', 'archived-notice');
  });
});
