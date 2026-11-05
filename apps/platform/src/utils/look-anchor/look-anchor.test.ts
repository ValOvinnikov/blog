import { isUndefined } from '@blog/utils/primitives';
import { LOOK_CARD, type TLookCard } from '@platform/constants/look-card';

import { findTopmostLookCard, toLookAnchorId } from './look-anchor';

const INDEX_BOTTOM = 120;
const ABOVE_INDEX = INDEX_BOTTOM - 1;
const BELOW_INDEX = INDEX_BOTTOM + 1;

const stubCardBottoms = (bottoms: Partial<Record<TLookCard, number>>) => {
  const bottomById = new Map(
    Object.entries(bottoms).map(([card, bottom]) => [
      toLookAnchorId(card as TLookCard),
      bottom,
    ]),
  );
  vi.stubGlobal('document', {
    getElementById: (id: string) => {
      const bottom = bottomById.get(id);
      return isUndefined(bottom)
        ? null
        : { getBoundingClientRect: () => ({ bottom }) };
    },
  });
};

describe(findTopmostLookCard, () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it.each<{
    title: string;
    bottoms: Partial<Record<TLookCard, number>>;
    expected: TLookCard;
  }>([
    {
      title: 'picks Preset while it reaches below the index',
      bottoms: {
        [LOOK_CARD.PRESET]: BELOW_INDEX,
        [LOOK_CARD.COLOUR]: BELOW_INDEX,
      },
      expected: LOOK_CARD.PRESET,
    },
    {
      title: 'skips the cards scrolled above the index',
      bottoms: {
        [LOOK_CARD.PRESET]: ABOVE_INDEX,
        [LOOK_CARD.COLOUR]: ABOVE_INDEX,
        [LOOK_CARD.BRAND]: BELOW_INDEX,
      },
      expected: LOOK_CARD.BRAND,
    },
    {
      title: 'counts a card ending exactly at the index as in view',
      bottoms: {
        [LOOK_CARD.PRESET]: ABOVE_INDEX,
        [LOOK_CARD.COLOUR]: INDEX_BOTTOM,
      },
      expected: LOOK_CARD.COLOUR,
    },
    {
      title: 'falls back to the last card once every card is above',
      bottoms: {
        [LOOK_CARD.PRESET]: ABOVE_INDEX,
        [LOOK_CARD.LANGUAGE_SWITCHER]: ABOVE_INDEX,
      },
      expected: LOOK_CARD.LANGUAGE_SWITCHER,
    },
  ])('$title', ({ bottoms, expected }) => {
    stubCardBottoms(bottoms);

    const card = findTopmostLookCard(INDEX_BOTTOM);

    expect(card).toBe(expected);
  });
});
