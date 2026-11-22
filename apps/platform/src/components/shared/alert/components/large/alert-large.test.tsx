import { faker } from '@faker-js/faker';
import { customRender, screen } from '@platform/testing/custom-render';
import { ALERT_TYPE, ICONS } from '@shinefold/config';

import { AlertLarge } from './alert-large';

faker.seed(7164);

const MOCK_TITLE = faker.lorem.words(4);
const MOCK_DESCRIPTION = faker.lorem.sentence();
const MOCK_ACTION_LABEL = faker.lorem.words(2);
const MOCK_ACTION_NOTE = faker.lorem.sentence();

const setup = customRender(AlertLarge, {
  type: ALERT_TYPE.WARNING,
  icon: ICONS.WARNING,
  title: MOCK_TITLE,
  description: MOCK_DESCRIPTION,
});

describe(`<${AlertLarge.name}/>`, () => {
  it('heads a warning with a second-level heading and reads as a status', () => {
    setup();

    const status = screen.getByRole('status');
    const heading = screen.getByRole('heading', { level: 2, name: MOCK_TITLE });

    expect(status).toHaveTextContent(MOCK_DESCRIPTION);
    expect(status).toContainElement(heading);
  });

  it('announces an error as an alert', () => {
    setup({ type: ALERT_TYPE.ERROR, icon: ICONS.PAUSE });

    const alert = screen.getByRole('alert');

    expect(alert).toHaveTextContent(MOCK_TITLE);
  });

  it('shows the action with its note', () => {
    setup({
      action: <button type="button">{MOCK_ACTION_LABEL}</button>,
      actionNote: MOCK_ACTION_NOTE,
    });

    const action = screen.getByRole('button', { name: MOCK_ACTION_LABEL });
    const note = screen.getByText(MOCK_ACTION_NOTE);

    expect(action).toBeVisible();
    expect(note).toBeVisible();
  });

  it('shows the description alone with no heading', () => {
    setup({ type: ALERT_TYPE.SUCCESS, icon: ICONS.CHECK, title: undefined });

    const heading = screen.queryByRole('heading');
    const status = screen.getByRole('status');

    expect(heading).not.toBeInTheDocument();
    expect(status).toHaveTextContent(MOCK_DESCRIPTION);
  });
});
