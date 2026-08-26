import { render, screen } from '@admin/testing/custom-render';
import { ALERT_TYPE } from '@blog/config';

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

  it('renders every tone without throwing', () => {
    for (const type of Object.values(ALERT_TYPE)) {
      expect(() => render(<Alert type={type} title="Label" />)).not.toThrow();
    }
  });
});
