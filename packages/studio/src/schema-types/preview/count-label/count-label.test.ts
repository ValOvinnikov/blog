import { countLabel } from '@shinefold/studio/schema-types/preview/count-label/count-label';

describe(countLabel, () => {
  it.each([
    {
      behaviour: 'uses the singular for one item',
      items: ['a'],
      expected: '1 logo',
    },
    {
      behaviour: 'adds an s for more than one item',
      items: ['a', 'b'],
      expected: '2 logos',
    },
    {
      behaviour: 'counts an empty list as zero',
      items: [],
      expected: '0 logos',
    },
    {
      behaviour: 'counts a missing list as zero',
      items: undefined,
      expected: '0 logos',
    },
  ])('$behaviour', ({ items, expected }) => {
    expect(countLabel(items, 'logo')).toBe(expected);
  });

  it('uses an irregular plural when one is given', () => {
    expect(countLabel(['a', 'b'], 'person', 'people')).toBe('2 people');
  });

  it('keeps the singular of an irregular plural for one item', () => {
    expect(countLabel(['a'], 'person', 'people')).toBe('1 person');
  });
});
