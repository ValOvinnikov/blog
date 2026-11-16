import type { THeroModuleType } from '@shinefold/config';
import {
  mockCtaSlotView,
  mockHeroSlotView,
  mockRawCtaRef,
  mockRawHeroRef,
} from '@shinefold/service/testing/pages/fixtures';

import { toHeroSlot, toModule, type TRawModule } from './to-module';

describe(toModule, () => {
  it('maps a raw module reference to its id and type', () => {
    expect(toModule(mockRawCtaRef())).toEqual(mockCtaSlotView());
  });
});

describe(toHeroSlot, () => {
  it('maps a hero module reference to a hero slot', () => {
    expect(toHeroSlot(mockRawHeroRef())).toEqual(mockHeroSlotView());
  });

  it('throws when the reference is not a hero type', () => {
    const nonHeroModule =
      mockRawCtaRef() as unknown as TRawModule<THeroModuleType>;

    expect(() => toHeroSlot(nonHeroModule)).toThrow();
  });

  it.each([null, undefined])('returns undefined for a %s reference', (raw) => {
    expect(toHeroSlot(raw)).toBeUndefined();
  });
});
