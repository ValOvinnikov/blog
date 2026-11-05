import { TOAST_TYPE } from '@blog/config';
import { faker } from '@faker-js/faker';
import { ICON_TEST_ID } from '@platform/constants/icon';
import messages from '@platform/i18n/messages/en.json';
import { ARIA_HIDDEN } from '@platform/testing/aria';
import { customRender, screen } from '@platform/testing/custom-render';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { Toast } from './toast';
import type { IToastRecord } from './toast-record';

faker.seed(5995);

const MOCK_MESSAGE = faker.lorem.sentence();
const MOCK_TITLE = faker.lorem.word();
const MOCK_TIME = faker.lorem.word();
const MOCK_ACTION_LABEL = faker.lorem.word();

const mockToastRecord = (overrides?: Partial<IToastRecord>): IToastRecord => ({
  id: faker.string.uuid(),
  type: TOAST_TYPE.SUCCESS,
  message: MOCK_MESSAGE,
  phase: 'visible',
  paused: false,
  createdAt: 0,
  ...overrides,
});

const setup = customRender(Toast, {
  record: mockToastRecord(),
  onDismiss: vi.fn(),
});

describe(`<${Toast.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  it('renders its message', () => {
    setup();

    const message = screen.getByText(MOCK_MESSAGE);

    expect(message).toBeVisible();
  });

  it('renders a title ahead of the message when given', () => {
    setup({ record: mockToastRecord({ title: MOCK_TITLE }) });

    const title = screen.getByText(MOCK_TITLE);
    const status = screen.getByRole('status');

    expect(title).toBeVisible();
    expect(status).toHaveTextContent(`${MOCK_TITLE}${MOCK_MESSAGE}`);
  });

  it('renders the time when given', () => {
    setup({ record: mockToastRecord({ time: MOCK_TIME }) });

    const time = screen.getByText(MOCK_TIME);

    expect(time).toBeVisible();
  });

  it('announces an error assertively', () => {
    setup({ record: mockToastRecord({ type: TOAST_TYPE.ERROR }) });

    const alert = screen.getByRole('alert');

    expect(alert).toHaveTextContent(MOCK_MESSAGE);
  });

  it.each([TOAST_TYPE.SUCCESS, TOAST_TYPE.WARNING, TOAST_TYPE.INFO])(
    'announces a %s toast politely',
    (type) => {
      setup({ record: mockToastRecord({ type }) });

      const status = screen.getByRole('status');

      expect(status).toHaveTextContent(MOCK_MESSAGE);
    },
  );

  it('dismisses from its labelled dismiss button', async () => {
    const onDismiss = vi.fn();
    setup({ onDismiss });

    const dismissButton = screen.getByRole('button', {
      name: messages.toast.dismissLabel,
    });
    await user.click(dismissButton);

    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it('runs its action from the action button', async () => {
    const onAct = vi.fn();
    setup({
      record: mockToastRecord({ action: { label: MOCK_ACTION_LABEL, onAct } }),
    });

    const actionButton = screen.getByRole('button', {
      name: MOCK_ACTION_LABEL,
    });
    await user.click(actionButton);

    expect(onAct).toHaveBeenCalledOnce();
  });

  it.each(Object.values(TOAST_TYPE))(
    'hides the %s status icon from assistive technology',
    (type) => {
      setup({ record: mockToastRecord({ type }) });

      const icon = screen.getByTestId(ICON_TEST_ID);

      expect(icon).toHaveAttribute(ARIA_HIDDEN, 'true');
    },
  );

  it('hides the status icon while loading', () => {
    setup({
      record: mockToastRecord({ type: TOAST_TYPE.INFO, isLoading: true }),
    });

    const message = screen.getByText(MOCK_MESSAGE);
    const icon = screen.queryByTestId(ICON_TEST_ID);

    expect(message).toBeVisible();
    expect(icon).not.toBeInTheDocument();
  });
});
