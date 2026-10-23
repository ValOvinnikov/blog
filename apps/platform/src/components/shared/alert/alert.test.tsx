import { ALERT_TYPE } from '@blog/config';
import { render, screen } from '@platform/testing/custom-render';
import { ARCHIVED_NOTICE_TEXT } from '@platform/testing/render-in-settings-form';

import { Alert } from './alert';

const PROVISIONED = 'Provisioned';

describe(Alert, () => {
  it('renders its title and description', () => {
    render(
      <Alert
        type={ALERT_TYPE.INFO}
        title="Not provisioned yet"
        description="Details are still fully editable."
      />,
    );

    const title = screen.getByText('Not provisioned yet');
    const description = screen.getByText('Details are still fully editable.');

    expect(title).toBeVisible();
    expect(description).toBeVisible();
  });

  it('renders without a description', () => {
    render(<Alert type={ALERT_TYPE.SUCCESS} title={PROVISIONED} />);

    const title = screen.getByText(PROVISIONED);

    expect(title).toBeVisible();
  });

  it('renders a description without a title', () => {
    render(
      <Alert type={ALERT_TYPE.INFO} description="Labels are translated." />,
    );

    const status = screen.getByRole('status');

    expect(status).toHaveTextContent('Labels are translated.');
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

    const paragraph = screen.getByText('They were kept on this device.');
    const summary = screen.getByText('Review the differences');

    expect(paragraph).toBeVisible();
    expect(summary).toBeVisible();
  });

  it('renders its action', () => {
    render(
      <Alert
        type={ALERT_TYPE.SUCCESS}
        title={PROVISIONED}
        action={<button type="button">View steps</button>}
      />,
    );

    const actionButton = screen.getByRole('button', { name: 'View steps' });

    expect(actionButton).toBeVisible();
  });

  it('renders an assertive alert role for the ERROR type', () => {
    render(<Alert type={ALERT_TYPE.ERROR} title="Provisioning failed" />);

    const alert = screen.getByRole('alert');

    expect(alert).toHaveTextContent('Provisioning failed');
  });

  it.each([ALERT_TYPE.SUCCESS, ALERT_TYPE.WARNING, ALERT_TYPE.INFO])(
    'renders a polite status role for the %s type',
    (type) => {
      render(<Alert type={type} title="Status update" />);

      const status = screen.getByRole('status');

      expect(status).toHaveTextContent('Status update');
    },
  );

  it('takes an explicit role over the one its type implies', () => {
    render(
      <Alert type={ALERT_TYPE.ERROR} role="status" title="Draft differs" />,
    );

    const status = screen.getByRole('status');
    const alert = screen.queryByRole('alert');

    expect(status).toHaveTextContent('Draft differs');
    expect(alert).not.toBeInTheDocument();
  });

  it('carries an id, so a control elsewhere can point aria-describedby at it', () => {
    render(
      <>
        <Alert
          id="archived-notice"
          type={ALERT_TYPE.WARNING}
          title={ARCHIVED_NOTICE_TEXT}
        />
        <button type="button" aria-describedby="archived-notice">
          Save
        </button>
      </>,
    );

    const saveButton = screen.getByRole('button', { name: 'Save' });

    expect(saveButton).toHaveAccessibleDescription(ARCHIVED_NOTICE_TEXT);
  });

  it('renders a decorative icon for every type', () => {
    for (const type of Object.values(ALERT_TYPE)) {
      const { unmount } = render(<Alert type={type} title="Label" />);
      const icon = screen.getByTestId('icon');

      expect(icon).toHaveAttribute('aria-hidden', 'true');
      unmount();
    }
  });
});
