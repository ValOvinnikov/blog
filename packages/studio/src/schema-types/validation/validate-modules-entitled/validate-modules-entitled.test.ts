import { MODULE_PACK } from '@blog/config/constants';
import { getModulePackOffMessage } from '@blog/studio/schema-types/inputs/requirement-warning-input/get-missing-requirement';
import {
  EVERY_MODULE_PACK,
  setEntitledModulePacks,
} from '@blog/studio/schema-types/validation/entitled-module-packs/entitled-module-packs';
import { validateModulesEntitled } from '@blog/studio/schema-types/validation/validate-modules-entitled/validate-modules-entitled';
import { faker } from '@faker-js/faker';

faker.seed(5048);

const MOCK_PRICING_KEY = faker.string.alphanumeric(12);
const CTA_MODULE = { _type: 'module_cta', _key: faker.string.alphanumeric(12) };
const PRICING_MODULE = { _type: 'module_pricing', _key: MOCK_PRICING_KEY };

describe(validateModulesEntitled, () => {
  afterEach(() => {
    setEntitledModulePacks(EVERY_MODULE_PACK);
  });

  it('warns on each module outside the entitled packs, at its item', () => {
    setEntitledModulePacks([MODULE_PACK.CORE]);

    expect(validateModulesEntitled([CTA_MODULE, PRICING_MODULE])).toEqual([
      {
        message: getModulePackOffMessage(MODULE_PACK.GROWTH),
        path: [{ _key: MOCK_PRICING_KEY }],
      },
    ]);
  });

  it('points at the index of an item without a key', () => {
    setEntitledModulePacks([MODULE_PACK.CORE]);

    expect(
      validateModulesEntitled([CTA_MODULE, { _type: PRICING_MODULE._type }]),
    ).toEqual([
      {
        message: getModulePackOffMessage(MODULE_PACK.GROWTH),
        path: [1],
      },
    ]);
  });

  it.each([
    {
      behaviour: 'every pack is entitled',
      packs: EVERY_MODULE_PACK,
      modules: [CTA_MODULE, PRICING_MODULE],
    },
    {
      behaviour: 'the page has no modules',
      packs: [MODULE_PACK.CORE],
      modules: undefined,
    },
  ])('passes when $behaviour', ({ packs, modules }) => {
    setEntitledModulePacks(packs);

    expect(validateModulesEntitled(modules)).toBe(true);
  });
});
