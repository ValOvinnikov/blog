import { ALERT_TYPE } from '@blog/config';
import { customRender, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';

import { Alert } from './alert';

faker.seed(123);

const message = faker.lorem.sentence();

const setup = customRender(Alert, {
  tone: ALERT_TYPE.INFO,
  children: message,
});

describe(`<${Alert.name}/>`, () => {
  it('renders the given children', () => {
    setup();
    expect(screen.getByText(message)).toBeVisible();
  });

  it('renders an assertive alert for the ERROR tone', () => {
    setup({ tone: ALERT_TYPE.ERROR });
    expect(screen.getByRole('alert')).toHaveTextContent(message);
  });

  it('renders a polite status for the SUCCESS tone', () => {
    setup({ tone: ALERT_TYPE.SUCCESS });
    expect(screen.getByRole('status')).toHaveTextContent(message);
  });

  it('renders a polite status for the WARNING tone', () => {
    setup({ tone: ALERT_TYPE.WARNING });
    expect(screen.getByRole('status')).toHaveTextContent(message);
  });

  it('renders a polite status for the INFO tone', () => {
    setup({ tone: ALERT_TYPE.INFO });
    expect(screen.getByRole('status')).toHaveTextContent(message);
  });

  it('renders composed children, not just plain text', () => {
    setup({
      children: (
        <>
          {message}
          <span data-testid="decoration" aria-hidden="true" />
        </>
      ),
    });
    expect(screen.getByTestId('decoration')).toBeVisible();
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
