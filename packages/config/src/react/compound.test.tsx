import type { ComponentPropsWithoutRef } from 'react';

import { mapCompoundSlots } from './compound';

const Alpha = ({
  children,
  emphasis,
}: ComponentPropsWithoutRef<'span'> & { emphasis?: boolean }) => (
  <span data-emphasis={emphasis}>{children}</span>
);
const Beta = ({ children }: ComponentPropsWithoutRef<'span'>) => (
  <span>{children}</span>
);
const Unknown = () => <span>unknown</span>;

const SLOTS = { alpha: Alpha, beta: Beta };

describe(mapCompoundSlots, () => {
  it('matches a single known slot', () => {
    const { slots, unmatched } = mapCompoundSlots(<Alpha>one</Alpha>, SLOTS);
    expect(slots.alpha?.props.children).toBe('one');
    expect(slots.beta).toBeUndefined();
    expect(unmatched).toHaveLength(0);
  });

  it('types a matched slot with its own component props', () => {
    const { slots } = mapCompoundSlots(<Alpha emphasis>one</Alpha>, SLOTS);
    expect(slots.alpha?.props.emphasis).toBe(true);
  });

  it('matches multiple different known slots', () => {
    const { slots } = mapCompoundSlots(
      [<Alpha key="a">one</Alpha>, <Beta key="b">two</Beta>],
      SLOTS,
    );
    expect(slots.alpha?.props.children).toBe('one');
    expect(slots.beta?.props.children).toBe('two');
  });

  it('routes an unknown component to unmatched', () => {
    const unknown = <Unknown key="u" />;
    const { unmatched } = mapCompoundSlots(
      [<Alpha key="a">one</Alpha>, unknown],
      SLOTS,
    );
    expect(unmatched).toHaveLength(1);
    expect(unmatched[0]).toMatchObject({ type: Unknown });
  });

  it('routes stray text children to unmatched', () => {
    const { unmatched } = mapCompoundSlots('stray text', SLOTS);
    expect(unmatched).toEqual(['stray text']);
  });

  it('keeps the first occurrence of a duplicate slot and routes the second to unmatched', () => {
    const { slots, unmatched } = mapCompoundSlots(
      [<Alpha key="1">first</Alpha>, <Alpha key="2">second</Alpha>],
      SLOTS,
    );
    expect(slots.alpha?.props.children).toBe('first');
    expect(unmatched).toHaveLength(1);
    expect(unmatched[0]).toMatchObject({ props: { children: 'second' } });
  });

  it('matches slots wrapped in a Fragment', () => {
    const { slots, unmatched } = mapCompoundSlots(
      <>
        <Alpha>one</Alpha>
        <Beta>two</Beta>
      </>,
      SLOTS,
    );
    expect(slots.alpha?.props.children).toBe('one');
    expect(slots.beta?.props.children).toBe('two');
    expect(unmatched).toHaveLength(0);
  });

  it('ignores false, null and undefined children', () => {
    const { unmatched } = mapCompoundSlots(
      [<Alpha key="a">one</Alpha>, false, null, undefined],
      SLOTS,
    );
    expect(unmatched).toHaveLength(0);
  });
});
