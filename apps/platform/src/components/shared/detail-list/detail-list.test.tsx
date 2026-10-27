import { faker } from '@faker-js/faker';
import {
  renderWithIntl,
  screen,
  within,
} from '@platform/testing/custom-render';

import { DetailList } from './detail-list';

faker.seed(5995);

const MOCK_LABEL = faker.lorem.words(2);
const MOCK_VALUE = faker.internet.domainName();
const MOCK_ACTION = faker.lorem.word();

describe(`<${DetailList.name}/>`, () => {
  beforeEach(() => {
    renderWithIntl(
      <DetailList>
        <DetailList.Row
          label={MOCK_LABEL}
          action={<button type="button">{MOCK_ACTION}</button>}
        >
          {MOCK_VALUE}
        </DetailList.Row>
      </DetailList>,
    );
  });

  it('renders the label as a definition term', () => {
    const term = screen.getByRole('term');

    expect(term).toHaveTextContent(MOCK_LABEL);
  });

  it('renders the value as its definition', () => {
    const definition = screen.getByRole('definition');
    const value = within(definition).getByText(MOCK_VALUE);

    expect(value).toBeVisible();
  });

  it('renders a trailing action alongside the value', () => {
    const definition = screen.getByRole('definition');
    const actionButton = within(definition).getByRole('button', {
      name: MOCK_ACTION,
    });

    expect(actionButton).toBeVisible();
  });
});
