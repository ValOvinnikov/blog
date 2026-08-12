import { deepMergePartial } from './deep-merge';

type TFixture = {
  a: { x: string; y: string };
  b: string;
};

const base: TFixture = {
  a: { x: 'x-base', y: 'y-base' },
  b: 'b-base',
};

describe(deepMergePartial, () => {
  it("replaces only the leaf keys an override's nested partial sets, leaving sibling keys untouched", () => {
    const result = deepMergePartial(base, { a: { x: 'x-override' } });

    expect(result.a.x).toBe('x-override');
    expect(result.a.y).toBe('y-base');
    expect(result.b).toBe('b-base');
  });

  it('applies multiple overrides left-to-right, each later one winning', () => {
    const result = deepMergePartial(
      base,
      { a: { x: 'x-first' }, b: 'b-first' },
      { a: { x: 'x-second' } },
    );

    expect(result.a.x).toBe('x-second');
    expect(result.a.y).toBe('y-base');
    expect(result.b).toBe('b-first');
  });

  it('leaves base fully unchanged when an override has no matching top-level key', () => {
    const result = deepMergePartial(base, {} as Partial<TFixture>);

    expect(result).toEqual(base);
  });

  it('is a no-op, not a crash, when an override argument is undefined', () => {
    const result = deepMergePartial(base, undefined);

    expect(result).toEqual(base);
  });
});
