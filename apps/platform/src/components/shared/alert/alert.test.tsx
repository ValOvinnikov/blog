import { ALERT_TYPE } from '@blog/config';
import { render, screen } from '@platform/testing/custom-render';

import { Alert } from './alert';

describe(Alert, () => {
  it('renders its title and description', () => {
    render(
      <Alert
        type={ALERT_TYPE.INFO}
        title="Not provisioned yet"
        description="Details are still fully editable."
      />,
    );
    expect(screen.getByText('Not provisioned yet')).toBeVisible();
    expect(screen.getByText('Details are still fully editable.')).toBeVisible();
  });

  it('renders without a description', () => {
    render(<Alert type={ALERT_TYPE.SUCCESS} title="Provisioned" />);
    expect(screen.getByText('Provisioned')).toBeVisible();
  });

  it('renders a description without a title', () => {
    render(
      <Alert type={ALERT_TYPE.INFO} description="Labels are translated." />,
    );
    expect(screen.getByRole('status')).toHaveTextContent(
      'Labels are translated.',
    );
  });

  it('renders rich content in its description', () => {
    render(
      <Alert
        type={ALERT_TYPE.WARNING}
        title="Unsaved changes"
        description={
          <>
            <p>They were kept on this device.</p>
            <details>
              <summary>Review the differences</summary>
            </details>
          </>
        }
      />,
    );
    expect(screen.getByText('They were kept on this device.')).toBeVisible();
    expect(screen.getByText('Review the differences')).toBeVisible();
  });

  it('renders its action', () => {
    render(
      <Alert
        type={ALERT_TYPE.SUCCESS}
        title="Provisioned"
        action={<button type="button">View steps</button>}
      />,
    );
    expect(screen.getByRole('button', { name: 'View steps' })).toBeVisible();
  });

  it('renders an assertive alert role for the ERROR type', () => {
    render(<Alert type={ALERT_TYPE.ERROR} title="Provisioning failed" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Provisioning failed');
  });

  it.each([ALERT_TYPE.SUCCESS, ALERT_TYPE.WARNING, ALERT_TYPE.INFO])(
    'renders a polite status role for the %s type',
    (type) => {
      render(<Alert type={type} title="Status update" />);
      expect(screen.getByRole('status')).toHaveTextContent('Status update');
    },
  );

  it('takes an explicit role over the one its type implies', () => {
    render(
      <Alert type={ALERT_TYPE.ERROR} role="status" title="Draft differs" />,
    );
    expect(screen.getByRole('status')).toHaveTextContent('Draft differs');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('carries an id, so a control elsewhere can point aria-describedby at it', () => {
    render(
      <>
        <Alert
          id="archived-notice"
          type={ALERT_TYPE.WARNING}
          title="This tenant is archived"
        />
        <button type="button" aria-describedby="archived-notice">
          Save
        </button>
      </>,
    );
    expect(
      screen.getByRole('button', { name: 'Save' }),
    ).toHaveAccessibleDescription('This tenant is archived');
  });

  it('renders a decorative icon for every type', () => {
    for (const type of Object.values(ALERT_TYPE)) {
      const { unmount } = render(<Alert type={type} title="Label" />);
      expect(screen.getByTestId('icon')).toHaveAttribute('aria-hidden', 'true');
      unmount();
    }
  });
});
