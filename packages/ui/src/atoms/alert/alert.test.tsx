import { ALERT_TYPE } from '@blog/config';
import { customRender, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';

import { Alert } from './alert';

faker.seed(123);

const message = faker.lorem.sentence();

const setup = customRender(Alert, {
  type: ALERT_TYPE.INFO,
  message,
});

describe(`<${Alert.name}/>`, () => {
  it('renders the given message', () => {
    setup();
    expect(screen.getByText(message)).toBeVisible();
  });

  it('renders an assertive alert for the ERROR type', () => {
    setup({ type: ALERT_TYPE.ERROR });
    expect(screen.getByRole('alert')).toHaveTextContent(message);
  });

  it('renders a polite status for the SUCCESS type', () => {
    setup({ type: ALERT_TYPE.SUCCESS });
    expect(screen.getByRole('status')).toHaveTextContent(message);
  });

  it('renders a polite status for the WARNING type', () => {
    setup({ type: ALERT_TYPE.WARNING });
    expect(screen.getByRole('status')).toHaveTextContent(message);
  });

  it('renders a polite status for the INFO type', () => {
    setup({ type: ALERT_TYPE.INFO });
    expect(screen.getByRole('status')).toHaveTextContent(message);
  });

  it('forwards dataTestId to the root element', () => {
    setup({ dataTestId: 'alert' });
    expect(screen.getByTestId('alert')).toBeVisible();
  });

  it('accepts a className override on the root', () => {
    const { container } = setup({ className: 'custom-class' });
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
