import { CAPABILITY } from './capability';
import {
  getModuleCapability,
  isModuleTypeEntitled,
  MODULE_PACK,
} from './module-pack';

const CASE_TITLE = '$behaviour';
const MOCK_UNKNOWN_TYPE = 'module_unknown';
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
      type: MOCK_UNKNOWN_TYPE,
      packs: EVERY_PACK,
      expected: false,
    },
  ])(CASE_TITLE, ({ type, packs, expected }) => {
    expect(isModuleTypeEntitled(type, packs)).toBe(expected);
  });
});

describe(getModuleCapability, () => {
  it.each([
    {
      behaviour: 'names the capability a gated module needs',
      type: 'module_newsletter',
      expected: CAPABILITY.NEWSLETTER,
    },
    {
      behaviour: 'names no capability for an ungated module',
      type: 'module_cta',
      expected: undefined,
    },
    {
      behaviour: 'names no capability for an unknown type',
      type: MOCK_UNKNOWN_TYPE,
      expected: undefined,
    },
  ])(CASE_TITLE, ({ type, expected }) => {
    expect(getModuleCapability(type)).toBe(expected);
  });
});
