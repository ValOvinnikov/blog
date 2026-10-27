import { ALERT_TYPE } from '@blog/config';
import { customRender, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';

import { Alert } from './alert';

faker.seed(123);

const MOCK_MESSAGE = faker.lorem.sentence();
const MOCK_ALERT_ID = faker.string.uuid();
const ALERT_ICON_TEST_ID = 'alert-icon';

const setup = customRender(Alert, {
  type: ALERT_TYPE.INFO,
  message: MOCK_MESSAGE,
});

describe(`<${Alert.name}/>`, () => {
  describe('with the default props', () => {
    beforeEach(() => {
      setup();
    });

    it('renders the given message', () => {
      const message = screen.getByText(MOCK_MESSAGE);

      expect(message).toBeVisible();
    });

    it('has no id attribute on the root element when none is given', () => {
      const status = screen.getByRole('status');

      expect(status).not.toHaveAttribute('id');
    });

    it('renders a type icon', () => {
      const icon = screen.getByTestId(ALERT_ICON_TEST_ID);

      expect(icon).toBeVisible();
    });
  });

  it.each([
    { type: ALERT_TYPE.ERROR, role: 'alert' },
    { type: ALERT_TYPE.SUCCESS, role: 'status' },
    { type: ALERT_TYPE.WARNING, role: 'status' },
    { type: ALERT_TYPE.INFO, role: 'status' },
  ])('announces the $type type as $role', ({ type, role }) => {
    setup({ type });

    const alert = screen.getByRole(role);

    expect(alert).toHaveTextContent(MOCK_MESSAGE);
  });

  it('forwards id to the root element', () => {
    setup({ id: MOCK_ALERT_ID });

    const status = screen.getByRole('status');

    expect(status).toHaveAttribute('id', MOCK_ALERT_ID);
  });

  it('renders no icon when hasIcon is false', () => {
    setup({ hasIcon: false });

    const icon = screen.queryByTestId(ALERT_ICON_TEST_ID);

    expect(icon).not.toBeInTheDocument();
  });
});
