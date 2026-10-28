import { faker } from '@faker-js/faker';
import messages from '@platform/i18n/messages/en.json';
import { customRender, screen } from '@platform/testing/custom-render';

import { DeadEndView } from './dead-end-view';

faker.seed(2404);

const MOCK_BADGE_LABEL = faker.lorem.word();
const MOCK_TITLE = faker.lorem.words(3);
const MOCK_DESCRIPTION = faker.lorem.sentence();
const MOCK_ACTION_LABEL = faker.lorem.words(2);
const MOCK_ERROR_ID = faker.string.alphanumeric(10);

const setup = customRender(DeadEndView, {
  badge: { label: MOCK_BADGE_LABEL, tone: 'bad' },
  title: MOCK_TITLE,
  description: MOCK_DESCRIPTION,
  action: <button type="button">{MOCK_ACTION_LABEL}</button>,
});

describe(`<${DeadEndView.name}/>`, () => {
  it('renders the title as the only page heading with its badge, description and action', () => {
    setup();

    const headings = screen.getAllByRole('heading', { level: 1 });
    const badge = screen.getByText(MOCK_BADGE_LABEL);
    const description = screen.getByText(MOCK_DESCRIPTION);
    const action = screen.getByRole('button', { name: MOCK_ACTION_LABEL });

    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent(MOCK_TITLE);
    expect(badge).toBeVisible();
    expect(description).toBeVisible();
    expect(action).toBeVisible();
  });

  it('names the product in text inside the main landmark', () => {
    setup();

    const main = screen.getByRole('main');
    const wordmark = screen.getByText(messages.deadEndView.brandName);

    expect(main).toContainElement(wordmark);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('shows the error id when one is given', () => {
    setup({ errorId: MOCK_ERROR_ID });

    const errorId = screen.getByText(MOCK_ERROR_ID, { exact: false });

    expect(errorId).toBeVisible();
  });

  it('shows no error id line without one', () => {
    setup();

    const errorId = screen.queryByText(MOCK_ERROR_ID, { exact: false });

    expect(errorId).not.toBeInTheDocument();
  });
});
