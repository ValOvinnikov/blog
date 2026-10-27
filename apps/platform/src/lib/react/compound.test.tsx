import { faker } from '@faker-js/faker';
import {
  renderWithIntl,
  screen,
  within,
} from '@platform/testing/custom-render';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import { mapCompoundSlots } from './compound';

faker.seed(1);

const MOCK_FIRST_TEXT = faker.lorem.words(2);
const MOCK_SECOND_TEXT = faker.lorem.words(3);
const MOCK_UNKNOWN_TEXT = faker.lorem.words(4);
const MOCK_STRAY_TEXT = faker.lorem.words(5);
const UNMATCHED_ITEM_TEST_ID = 'unmatched-item';

const Alpha = ({ children }: ComponentPropsWithoutRef<'span'>) => (
  <span data-testid="alpha">{children}</span>
);
const Beta = ({ children }: ComponentPropsWithoutRef<'span'>) => (
  <span data-testid="beta">{children}</span>
);
const Unknown = ({ children }: ComponentPropsWithoutRef<'span'>) => (
  <span>{children}</span>
);

const TestHarness = ({ children }: { children: ReactNode }) => {
  const { slots, unmatched } = mapCompoundSlots(children, {
    alpha: Alpha,
    beta: Beta,
  });
  return (
    <div>
      <div data-testid="slot-alpha">{slots.alpha}</div>
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
  it('matches a single known slot', () => {
    renderWithIntl(
      <TestHarness>
        <Alpha>{MOCK_FIRST_TEXT}</Alpha>
      </TestHarness>,
    );

    const alpha = screen.getByTestId('alpha');

    expect(alpha).toBeVisible();
    expect(alpha).toHaveTextContent(MOCK_FIRST_TEXT);
  });

  it('matches multiple different known slots', () => {
    renderWithIntl(
      <TestHarness>
        <Alpha>{MOCK_FIRST_TEXT}</Alpha>
        <Beta>{MOCK_SECOND_TEXT}</Beta>
      </TestHarness>,
    );

    const alpha = screen.getByTestId('alpha');
    const beta = screen.getByTestId('beta');

    expect(alpha).toHaveTextContent(MOCK_FIRST_TEXT);
    expect(beta).toHaveTextContent(MOCK_SECOND_TEXT);
  });

  it('routes an unknown component to unmatched', () => {
    renderWithIntl(
      <TestHarness>
        <Alpha>{MOCK_FIRST_TEXT}</Alpha>
        <Unknown>{MOCK_UNKNOWN_TEXT}</Unknown>
      </TestHarness>,
    );

    const unmatchedItems = screen.getAllByTestId(UNMATCHED_ITEM_TEST_ID);
    const unknown = screen.getByText(MOCK_UNKNOWN_TEXT);

    expect(unmatchedItems).toHaveLength(1);
    expect(unknown).toBeVisible();
  });

  it('routes stray text children to unmatched', () => {
    renderWithIntl(<TestHarness>{MOCK_STRAY_TEXT}</TestHarness>);

    const strayText = screen.getByText(MOCK_STRAY_TEXT);

    expect(strayText).toBeVisible();
  });

  it('routes a second occurrence of a slot to unmatched', () => {
    renderWithIntl(
      <TestHarness>
        <Alpha>{MOCK_FIRST_TEXT}</Alpha>
        <Alpha>{MOCK_SECOND_TEXT}</Alpha>
      </TestHarness>,
    );

    const slotAlpha = screen.getByTestId('slot-alpha');
    const unmatched = screen.getByTestId('unmatched');
    const matchedAlpha = within(slotAlpha).getByTestId('alpha');
    const unmatchedItem = within(unmatched).getByTestId(UNMATCHED_ITEM_TEST_ID);

    expect(matchedAlpha).toHaveTextContent(MOCK_FIRST_TEXT);
    expect(unmatchedItem).toHaveTextContent(MOCK_SECOND_TEXT);
  });

  it('matches slots wrapped in a single Fragment', () => {
    renderWithIntl(
      <TestHarness>
        <>
          <Alpha>{MOCK_FIRST_TEXT}</Alpha>
          <Beta>{MOCK_SECOND_TEXT}</Beta>
        </>
      </TestHarness>,
    );

    const alpha = screen.getByTestId('alpha');
    const beta = screen.getByTestId('beta');
    const unmatchedItems = screen.queryAllByTestId(UNMATCHED_ITEM_TEST_ID);

    expect(alpha).toHaveTextContent(MOCK_FIRST_TEXT);
    expect(beta).toHaveTextContent(MOCK_SECOND_TEXT);
    expect(unmatchedItems).toHaveLength(0);
  });

  it('ignores false, null and undefined children', () => {
    renderWithIntl(
      <TestHarness>
        <Alpha>{MOCK_FIRST_TEXT}</Alpha>
        {false}
        {null}
        {undefined}
      </TestHarness>,
    );

    const unmatchedItems = screen.queryAllByTestId(UNMATCHED_ITEM_TEST_ID);

    expect(unmatchedItems).toHaveLength(0);
  });
});
