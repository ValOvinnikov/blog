import { render, screen } from '@platform/testing/custom-render';

import { CardList } from './card-list';

type TEntry = { id: string; title: string };

const renderEntry = ({ id, title }: TEntry) => (
  <CardList.Row
    key={id}
    lead={<span>Lead {id}</span>}
    primary={title}
    secondary={`Secondary ${id}`}
    time={{ date: new Date('2026-08-24T12:00:00.000Z'), label: '5m ago' }}
  >
    <button type="button">Details {id}</button>
  </CardList.Row>
);

describe(CardList, () => {
  it('shows the empty message when there are no items', () => {
    render(
      <CardList
        items={[]}
        emptyMessage="Nothing here yet."
        renderRow={renderEntry}
      />,
    );

    expect(screen.getByText('Nothing here yet.')).toBeVisible();
  });

  it('renders a row per item with its lead, lines and extra content', () => {
    render(
      <CardList
        items={[
          { id: '1', title: 'First' },
          { id: '2', title: 'Second' },
        ]}
        emptyMessage="Nothing here yet."
        renderRow={renderEntry}
      />,
    );

    expect(screen.getByText('Lead 1')).toBeVisible();
    expect(screen.getByText('First')).toBeVisible();
    expect(screen.getByText('Secondary 2')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Details 2' })).toBeVisible();
    expect(screen.queryByText('Nothing here yet.')).not.toBeInTheDocument();
  });

  it('marks each row time with its machine-readable date', () => {
    render(
      <CardList
        items={[{ id: '1', title: 'First' }]}
        emptyMessage="Nothing here yet."
        renderRow={renderEntry}
      />,
    );

    expect(screen.getByText('5m ago')).toHaveAttribute(
      'dateTime',
      '2026-08-24T12:00:00.000Z',
    );
  });
});
