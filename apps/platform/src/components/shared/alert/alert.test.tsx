import { ALERT_TYPE } from '@blog/config';
import { faker } from '@faker-js/faker';
import {
  customRender,
  renderWithIntl,
  screen,
} from '@platform/testing/custom-render';

import { Alert } from './alert';

faker.seed(5995);

const MOCK_TITLE = faker.lorem.words(3);
const MOCK_DESCRIPTION = faker.lorem.sentence();
const MOCK_PARAGRAPH = faker.lorem.sentence();
const MOCK_SUMMARY = faker.lorem.words(3);
const MOCK_ACTION_LABEL = faker.lorem.words(2);
const MOCK_ALERT_ID = faker.string.alpha(8);
const MOCK_CONTROL_LABEL = faker.lorem.word();

const setup = customRender(Alert, {
  type: ALERT_TYPE.INFO,
  title: MOCK_TITLE,
});

describe(`<${Alert.name}/>`, () => {
  it('renders its title and description', () => {
    setup({ description: MOCK_DESCRIPTION });

    const title = screen.getByText(MOCK_TITLE);
    const description = screen.getByText(MOCK_DESCRIPTION);

    expect(title).toBeVisible();
    expect(description).toBeVisible();
  });

  it('renders a description without a title', () => {
    setup({ title: undefined, description: MOCK_DESCRIPTION });

    const status = screen.getByRole('status');

    expect(status).toHaveTextContent(MOCK_DESCRIPTION);
  });

  it('renders rich content in its description', () => {
    setup({
      description: (
        <>
          <p>{MOCK_PARAGRAPH}</p>
          <details>
            <summary>{MOCK_SUMMARY}</summary>
          </details>
        </>
      ),
    });

    const paragraph = screen.getByText(MOCK_PARAGRAPH);
    const summary = screen.getByText(MOCK_SUMMARY);

    expect(paragraph).toBeVisible();
    expect(summary).toBeVisible();
  });

  it('renders its action', () => {
    setup({ action: <button type="button">{MOCK_ACTION_LABEL}</button> });

    const actionButton = screen.getByRole('button', {
      name: MOCK_ACTION_LABEL,
    });

    expect(actionButton).toBeVisible();
  });

  it('announces an error assertively', () => {
    setup({ type: ALERT_TYPE.ERROR });

    const alert = screen.getByRole('alert');

    expect(alert).toHaveTextContent(MOCK_TITLE);
  });

  it.each([ALERT_TYPE.SUCCESS, ALERT_TYPE.WARNING, ALERT_TYPE.INFO])(
    'announces a %s alert politely',
    (type) => {
      setup({ type });

      const status = screen.getByRole('status');

      expect(status).toHaveTextContent(MOCK_TITLE);
    },
  );

  it('takes an explicit role over the one its type implies', () => {
    setup({ type: ALERT_TYPE.ERROR, role: 'status' });

    const status = screen.getByRole('status');
    const alert = screen.queryByRole('alert');

    expect(status).toHaveTextContent(MOCK_TITLE);
    expect(alert).not.toBeInTheDocument();
  });

  it('describes a control elsewhere on the page that points at it', () => {
    renderWithIntl(
      <>
        <Alert
          id={MOCK_ALERT_ID}
          type={ALERT_TYPE.WARNING}
          title={MOCK_TITLE}
        />
        <button type="button" aria-describedby={MOCK_ALERT_ID}>
          {MOCK_CONTROL_LABEL}
        </button>
      </>,
    );

    const control = screen.getByRole('button', { name: MOCK_CONTROL_LABEL });

    expect(control).toHaveAccessibleDescription(MOCK_TITLE);
  });

  it.each(Object.values(ALERT_TYPE))(
    'renders a decorative icon for a %s alert',
    (type) => {
      setup({ type });

      const icon = screen.getByTestId('icon');

      expect(icon).toHaveAttribute('aria-hidden', 'true');
    },
  );
});
