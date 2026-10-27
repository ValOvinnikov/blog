import { renderElement, screen, within } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';
import {
  cloneElement,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from 'react';

import { mapCompoundSlots } from './compound';

faker.seed(123);

const UNMATCHED_ITEM_TEST_ID = 'unmatched-item';
const MOCK_FIRST = faker.lorem.sentence();
const MOCK_SECOND = faker.lorem.sentence();
const MOCK_STRAY = faker.lorem.sentence();
const MOCK_UNKNOWN = faker.lorem.sentence();

const Alpha = ({
  children,
  emphasis,
}: ComponentPropsWithoutRef<'span'> & { emphasis?: boolean }) => (
  <span data-testid="alpha" data-emphasis={emphasis}>
    {children}
  </span>
);
const Beta = ({ children }: ComponentPropsWithoutRef<'span'>) => (
  <span data-testid="beta">{children}</span>
);
const Unknown = () => <span>{MOCK_UNKNOWN}</span>;

const TestHarness = ({ children }: { children: ReactNode }) => {
  const { slots, unmatched } = mapCompoundSlots(children, {
    alpha: Alpha,
    beta: Beta,
  });
  const alpha = slots.alpha
    ? cloneElement(slots.alpha, { emphasis: true })
    : slots.alpha;
  return (
    <div>
      <div data-testid="slot-alpha">{alpha}</div>
      <div data-testid="slot-beta">{slots.beta}</div>
      <div data-testid="unmatched">
        {unmatched.map((node, i) => (
          <span key={i} data-testid={UNMATCHED_ITEM_TEST_ID}>
            {node}
          </span>
        ))}
      </div>
    </div>
  );
};

describe(mapCompoundSlots, () => {
  it('matches a single known slot, typed with its own component props', () => {
    renderElement(
      <TestHarness>
        <Alpha>{MOCK_FIRST}</Alpha>
      </TestHarness>,
    );

    const alpha = screen.getByTestId('alpha');

    expect(alpha).toHaveTextContent(MOCK_FIRST);
    expect(alpha).toHaveAttribute('data-emphasis', 'true');
  });

  it('matches multiple different known slots', () => {
    renderElement(
      <TestHarness>
        <Alpha>{MOCK_FIRST}</Alpha>
        <Beta>{MOCK_SECOND}</Beta>
      </TestHarness>,
    );

    const alpha = screen.getByTestId('alpha');
    const beta = screen.getByTestId('beta');

    expect(alpha).toHaveTextContent(MOCK_FIRST);
    expect(beta).toHaveTextContent(MOCK_SECOND);
  });

  it('routes an unknown component to unmatched', () => {
    renderElement(
      <TestHarness>
        <Alpha>{MOCK_FIRST}</Alpha>
        <Unknown />
      </TestHarness>,
    );

    const unmatched = screen.getByTestId('unmatched');
    const unknownItems = within(unmatched).getAllByTestId(
      UNMATCHED_ITEM_TEST_ID,
    );
    const unknown = within(unmatched).getByText(MOCK_UNKNOWN);

    expect(unknownItems).toHaveLength(1);
    expect(unknown).toBeVisible();
  });

  it('routes stray text children to unmatched', () => {
    renderElement(<TestHarness>{MOCK_STRAY}</TestHarness>);

    const unmatched = screen.getByTestId('unmatched');
    const stray = within(unmatched).getByText(MOCK_STRAY);

    expect(stray).toBeVisible();
  });

  it('routes a second occurrence of a slot to unmatched', () => {
    renderElement(
      <TestHarness>
        <Alpha>{MOCK_FIRST}</Alpha>
        <Alpha>{MOCK_SECOND}</Alpha>
      </TestHarness>,
    );

    const slotAlpha = screen.getByTestId('slot-alpha');
    const unmatched = screen.getByTestId('unmatched');
    const matchedAlpha = within(slotAlpha).getByTestId('alpha');
    const unmatchedItem = within(unmatched).getByTestId(UNMATCHED_ITEM_TEST_ID);

    expect(matchedAlpha).toHaveTextContent(MOCK_FIRST);
    expect(unmatchedItem).toHaveTextContent(MOCK_SECOND);
  });

  it('matches slots wrapped in a single Fragment', () => {
    renderElement(
      <TestHarness>
        <>
          <Alpha>{MOCK_FIRST}</Alpha>
          <Beta>{MOCK_SECOND}</Beta>
        </>
      </TestHarness>,
    );

    const alpha = screen.getByTestId('alpha');
    const beta = screen.getByTestId('beta');
    const unmatchedItems = screen.queryAllByTestId(UNMATCHED_ITEM_TEST_ID);

    expect(alpha).toHaveTextContent(MOCK_FIRST);
    expect(beta).toHaveTextContent(MOCK_SECOND);
    expect(unmatchedItems).toHaveLength(0);
  });

  it('drops false, null and undefined children', () => {
    renderElement(
      <TestHarness>
        <Alpha>{MOCK_FIRST}</Alpha>
        {false}
        {null}
        {undefined}
      </TestHarness>,
    );

    const unmatchedItems = screen.queryAllByTestId(UNMATCHED_ITEM_TEST_ID);

    expect(unmatchedItems).toHaveLength(0);
  });
});
