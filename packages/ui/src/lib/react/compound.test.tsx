import { render, screen, within } from '@testing-library/react';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import { mapCompoundSlots } from './compound';

const Alpha = ({ children }: ComponentPropsWithoutRef<'span'>) => (
  <span data-testid="alpha">{children}</span>
);
const Beta = ({ children }: ComponentPropsWithoutRef<'span'>) => (
  <span data-testid="beta">{children}</span>
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
          <span key={i} data-testid="unmatched-item">
            {node}
          </span>
        ))}
      </div>
    </div>
  );
};

describe(mapCompoundSlots, () => {
  it('matches a single known slot', () => {
    render(
      <TestHarness>
        <Alpha>one</Alpha>
      </TestHarness>,
    );
    expect(screen.getByTestId('alpha')).toBeVisible();
    expect(screen.getByTestId('alpha')).toHaveTextContent('one');
  });

  it('matches multiple different known slots', () => {
    render(
      <TestHarness>
        <Alpha>one</Alpha>
        <Beta>two</Beta>
      </TestHarness>,
    );
    expect(screen.getByTestId('alpha')).toHaveTextContent('one');
    expect(screen.getByTestId('beta')).toHaveTextContent('two');
  });

  it('routes an unknown component to unmatched', () => {
    const Unknown = () => <span>unknown</span>;
    render(
      <TestHarness>
        <Alpha>one</Alpha>
        <Unknown />
      </TestHarness>,
    );
    expect(screen.getAllByTestId('unmatched-item')).toHaveLength(1);
    expect(screen.getByText('unknown')).toBeVisible();
  });

  it('routes stray text children to unmatched', () => {
    render(<TestHarness>stray text</TestHarness>);
    expect(screen.getByText('stray text')).toBeVisible();
  });

  it('routes a duplicate slot (second occurrence) to unmatched', () => {
    render(
      <TestHarness>
        <Alpha>first</Alpha>
        <Alpha>second</Alpha>
      </TestHarness>,
    );
    const slotAlphaContainer = screen.getByTestId('slot-alpha');
    const unmatchedContainer = screen.getByTestId('unmatched');
    expect(within(slotAlphaContainer).getByTestId('alpha')).toHaveTextContent(
      'first',
    );
    expect(
      within(unmatchedContainer).getByTestId('unmatched-item'),
    ).toHaveTextContent('second');
  });

  it('matches slots wrapped in a single Fragment', () => {
    render(
      <TestHarness>
        <>
          <Alpha>one</Alpha>
          <Beta>two</Beta>
        </>
      </TestHarness>,
    );
    expect(screen.getByTestId('alpha')).toHaveTextContent('one');
    expect(screen.getByTestId('beta')).toHaveTextContent('two');
    expect(screen.queryAllByTestId('unmatched-item')).toHaveLength(0);
  });

  it('ignores false/null/undefined children without adding them to unmatched', () => {
    render(
      <TestHarness>
        <Alpha>one</Alpha>
        {false}
        {null}
        {undefined}
      </TestHarness>,
    );
    expect(screen.queryAllByTestId('unmatched-item')).toHaveLength(0);
  });
});
