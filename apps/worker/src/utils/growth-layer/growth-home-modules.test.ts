import { createMockFaker } from '@worker/testing/mock-faker';
import { mockKeyedReference } from '@worker/testing/sample-content/fixtures';

import { withGrowthHomeSlots } from './growth-home-modules';

const mockFaker = createMockFaker(5714);

const MOCK_INTRO_ID = mockFaker.string.uuid();
const MOCK_FIRST_ID = mockFaker.string.uuid();
const MOCK_HERO = mockKeyedReference(mockFaker.string.uuid());
const MOCK_INTRO = mockKeyedReference(MOCK_INTRO_ID);
const MOCK_CTA = mockKeyedReference(mockFaker.string.uuid());
const MOCK_FREE_MODULES = [MOCK_HERO, MOCK_INTRO, MOCK_CTA];
const MOCK_FIRST_SLOT = mockKeyedReference(MOCK_FIRST_ID);
const MOCK_SECOND_SLOT = mockKeyedReference(mockFaker.string.uuid());
const MOCK_HOME_SLOTS = [
  { slot: MOCK_FIRST_SLOT, after: MOCK_INTRO_ID },
  { slot: MOCK_SECOND_SLOT, after: MOCK_FIRST_ID },
] as Parameters<typeof withGrowthHomeSlots>[1];

describe(withGrowthHomeSlots, () => {
  it('places each slot after the one it follows, in order', () => {
    expect(withGrowthHomeSlots(MOCK_FREE_MODULES, MOCK_HOME_SLOTS)).toEqual([
      MOCK_HERO,
      MOCK_INTRO,
      MOCK_FIRST_SLOT,
      MOCK_SECOND_SLOT,
      MOCK_CTA,
    ]);
  });

  it('keeps an owner’s order and adds only the missing slot', () => {
    const ownerOrder = [MOCK_SECOND_SLOT, MOCK_HERO, MOCK_INTRO];

    expect(withGrowthHomeSlots(ownerOrder, MOCK_HOME_SLOTS)).toEqual([
      MOCK_SECOND_SLOT,
      MOCK_HERO,
      MOCK_INTRO,
      MOCK_FIRST_SLOT,
    ]);
  });

  it('treats a section the owner re-added under a new key as present', () => {
    const readded = { ...MOCK_FIRST_SLOT, _key: mockFaker.string.uuid() };

    expect(
      withGrowthHomeSlots([...MOCK_FREE_MODULES, readded], MOCK_HOME_SLOTS),
    ).not.toContainEqual(MOCK_FIRST_SLOT);
  });

  it('adds a slot last when the section it follows was removed', () => {
    const withoutIntro = [MOCK_HERO, MOCK_CTA];

    expect(withGrowthHomeSlots(withoutIntro, MOCK_HOME_SLOTS)).toEqual([
      ...withoutIntro,
      MOCK_FIRST_SLOT,
      MOCK_SECOND_SLOT,
    ]);
  });

  it('returns null when every slot is already present', () => {
    const applied = withGrowthHomeSlots(MOCK_FREE_MODULES, MOCK_HOME_SLOTS);

    expect(withGrowthHomeSlots(applied ?? [], MOCK_HOME_SLOTS)).toBeNull();
  });
});
