import { faker } from '@faker-js/faker';
import { renderWithIntl, screen } from '@platform/testing/custom-render';

import { CardList } from './card-list';

faker.seed(5995);

type TEntry = {
  id: string;
  lead: string;
  title: string;
  secondary: string;
  action: string;
};

const mockEntry = (): TEntry => ({
  id: faker.string.uuid(),
  lead: faker.lorem.words(2),
  title: faker.lorem.words(3),
  secondary: faker.lorem.sentence(),
  action: faker.lorem.words(2),
});

const MOCK_EMPTY_MESSAGE = faker.lorem.sentence();
const MOCK_DATE = faker.date.past();
const MOCK_RELATIVE_TIME = faker.lorem.words(2);
const MOCK_ENTRY = mockEntry();

const renderEntry = ({ id, lead, title, secondary, action }: TEntry) => (
  <CardList.Row key={id}>
    <CardList.Lead>
      <span>{lead}</span>
    </CardList.Lead>
    <CardList.Primary>{title}</CardList.Primary>
    <CardList.Secondary>{secondary}</CardList.Secondary>
    <CardList.Footer>
      <button type="button">{action}</button>
    </CardList.Footer>
    <CardList.Time date={MOCK_DATE}>{MOCK_RELATIVE_TIME}</CardList.Time>
  </CardList.Row>
);

const renderList = (items: TEntry[]) =>
  renderWithIntl(
    <CardList
      items={items}
      emptyMessage={MOCK_EMPTY_MESSAGE}
      renderRow={renderEntry}
    />,
  );

describe(`<${CardList.name}/>`, () => {
  it('shows the empty message when there are no items', () => {
    renderList([]);

    const emptyMessage = screen.getByText(MOCK_EMPTY_MESSAGE);

    expect(emptyMessage).toBeVisible();
  });

  describe('with an item', () => {
    beforeEach(() => {
      renderList([MOCK_ENTRY]);
    });

    it.each([
      ['lead', MOCK_ENTRY.lead],
      ['primary line', MOCK_ENTRY.title],
      ['secondary line', MOCK_ENTRY.secondary],
    ])('renders the row %s', (_slot, text) => {
      const content = screen.getByText(text);

      expect(content).toBeVisible();
    });

    it('renders the row footer content', () => {
      const actionButton = screen.getByRole('button', {
        name: MOCK_ENTRY.action,
      });

      expect(actionButton).toBeVisible();
    });

    it('hides the empty message', () => {
      const emptyMessage = screen.queryByText(MOCK_EMPTY_MESSAGE);

      expect(emptyMessage).not.toBeInTheDocument();
    });

    it('marks the row time with its machine-readable date', () => {
      const time = screen.getByText(MOCK_RELATIVE_TIME);

      expect(time).toHaveAttribute('dateTime', MOCK_DATE.toISOString());
    });
  });
});
