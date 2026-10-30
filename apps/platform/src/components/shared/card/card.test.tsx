import { faker } from '@faker-js/faker';
import {
  customRender,
  renderWithIntl,
  screen,
} from '@platform/testing/custom-render';

import { Card } from './card';
import type { TCardHeaderProps } from './components/header/card-header';

faker.seed(5995);

const MOCK_TITLE = faker.lorem.words(2);
const MOCK_SUPPORTING_TEXT = faker.lorem.sentence();
const MOCK_ACTION = faker.lorem.word();
const MOCK_BODY = faker.lorem.sentence();
const MOCK_FOOTER = faker.lorem.sentence();
const MOCK_TITLE_ID = faker.string.alpha(8);

const HeaderCard = (props: TCardHeaderProps) => (
  <Card>
    <Card.Header {...props} />
  </Card>
);

const setup = customRender(HeaderCard, { title: MOCK_TITLE });

describe(`<${Card.name}/>`, () => {
  it('renders the header title at a caller-supplied heading level', () => {
    setup({ headingLevel: 3 });

    const heading = screen.getByRole('heading', { level: 3, name: MOCK_TITLE });

    expect(heading).toBeVisible();
  });

  it('renders a header description when provided', () => {
    setup({ supportingText: MOCK_SUPPORTING_TEXT });

    const supportingText = screen.getByText(MOCK_SUPPORTING_TEXT);

    expect(supportingText).toBeVisible();
  });

  it('renders header actions when provided', () => {
    setup({ actions: <button type="button">{MOCK_ACTION}</button> });

    const actionButton = screen.getByRole('button', { name: MOCK_ACTION });

    expect(actionButton).toBeVisible();
  });

  it('omits the header description and actions when not provided', () => {
    setup();

    const supportingText = screen.queryByText(MOCK_SUPPORTING_TEXT);
    const actionButton = screen.queryByRole('button');

    expect(supportingText).not.toBeInTheDocument();
    expect(actionButton).not.toBeInTheDocument();
  });

  it('renders header, body and footer in that order whatever the JSX order', () => {
    renderWithIntl(
      <Card>
        <Card.Footer>{MOCK_FOOTER}</Card.Footer>
        <Card.Body>{MOCK_BODY}</Card.Body>
        <Card.Header title={MOCK_TITLE} />
      </Card>,
    );

    const heading = screen.getByRole('heading', { name: MOCK_TITLE });
    const body = screen.getByText(MOCK_BODY);
    const footer = screen.getByText(MOCK_FOOTER);

    expect(heading).toBeVisible();
    expect(body).toBeVisible();
    expect(footer).toBeVisible();
    expect(heading.compareDocumentPosition(body)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(body.compareDocumentPosition(footer)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it('is a group named by the element it is labelled by', () => {
    renderWithIntl(
      <Card aria-labelledby={MOCK_TITLE_ID}>
        <Card.Header title={<span id={MOCK_TITLE_ID}>{MOCK_TITLE}</span>} />
        <Card.Body>{MOCK_BODY}</Card.Body>
      </Card>,
    );

    const group = screen.getByRole('group', { name: MOCK_TITLE });

    expect(group).toHaveTextContent(MOCK_BODY);
  });

  it('is not a group when nothing labels it', () => {
    setup();

    const group = screen.queryByRole('group');

    expect(group).not.toBeInTheDocument();
  });
});
