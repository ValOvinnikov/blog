import { isModuleTypeEntitled, MODULE_PACK } from './module-pack';

const CORE_ONLY = [MODULE_PACK.CORE];
const EVERY_PACK = [MODULE_PACK.CORE, MODULE_PACK.GROWTH];

describe(isModuleTypeEntitled, () => {
  it.each([
    {
      behaviour: 'entitles a core module on core alone',
      type: 'module_cta',
      packs: CORE_ONLY,
      expected: true,
    },
    {
      behaviour: 'withholds a growth module on core alone',
      type: 'module_pricing',
      packs: CORE_ONLY,
      expected: false,
    },
    {
      behaviour: 'entitles a growth module when growth is included',
      type: 'module_pricing',
      packs: EVERY_PACK,
      expected: true,
    },
    {
      behaviour: 'withholds every module when no pack is given',
      type: 'module_cta',
      packs: [],
      expected: false,
    },
    {
      behaviour: 'never entitles an unknown type',
      type: 'module_unknown',
      packs: EVERY_PACK,
      expected: false,
    },
  ])('$behaviour', ({ type, packs, expected }) => {
    expect(isModuleTypeEntitled(type, packs)).toBe(expected);
  });
});
