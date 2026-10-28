import { CAPABILITY, MODULE_PACK } from '@blog/config/constants';
import { getRequirementOffSuffix } from '@blog/studio/schema-types/inputs/requirement-warning-input/get-missing-requirement';
import { markRequirementOffTypes } from '@blog/studio/schema-types/inputs/requirement-warning-input/mark-requirement-off-types';
import { EVERY_MODULE_PACK } from '@blog/studio/schema-types/validation/entitled-module-packs/entitled-module-packs';
import { faker } from '@faker-js/faker';

faker.seed(4107);

const MOCK_CTA_TITLE = faker.lorem.word();
const MOCK_NEWSLETTER_TITLE = faker.lorem.word();
const MOCK_PRICING_TITLE = faker.lorem.word();
const MOCK_CTA_TYPE = { name: 'module_cta', title: MOCK_CTA_TITLE };
const MOCK_NEWSLETTER_TYPE = {
  name: 'module_newsletter',
  title: MOCK_NEWSLETTER_TITLE,
};
const MOCK_PRICING_TYPE = { name: 'module_pricing', title: MOCK_PRICING_TITLE };
const MOCK_TYPES = [MOCK_CTA_TYPE, MOCK_NEWSLETTER_TYPE, MOCK_PRICING_TYPE];
const CORE_ONLY = [MODULE_PACK.CORE];

const titles = (types: readonly { name: string; title?: string }[] | null) =>
  types?.map(({ name, title }) => [name, title]);

describe(markRequirementOffTypes, () => {
  it('marks a gated type whose capability is off', () => {
    const marked = markRequirementOffTypes(MOCK_TYPES, {
      enabledCapabilities: [CAPABILITY.COMMENTS],
      entitledModulePacks: EVERY_MODULE_PACK,
    });

    expect(titles(marked)).toEqual([
      [MOCK_CTA_TYPE.name, MOCK_CTA_TITLE],
      [
        MOCK_NEWSLETTER_TYPE.name,
        `${MOCK_NEWSLETTER_TITLE} ${getRequirementOffSuffix({ capability: CAPABILITY.NEWSLETTER })}`,
      ],
      [MOCK_PRICING_TYPE.name, MOCK_PRICING_TITLE],
    ]);
  });

  it('marks a module type outside the entitled packs', () => {
    const marked = markRequirementOffTypes(MOCK_TYPES, {
      entitledModulePacks: CORE_ONLY,
    });

    expect(titles(marked)).toEqual([
      [MOCK_CTA_TYPE.name, MOCK_CTA_TITLE],
      [MOCK_NEWSLETTER_TYPE.name, MOCK_NEWSLETTER_TITLE],
      [
        MOCK_PRICING_TYPE.name,
        `${MOCK_PRICING_TITLE} ${getRequirementOffSuffix({ modulePack: MODULE_PACK.GROWTH })}`,
      ],
    ]);
  });

  it('keeps every other property of the marked type', () => {
    const [marked] =
      markRequirementOffTypes(
        [{ ...MOCK_NEWSLETTER_TYPE, jsonType: 'object' }],
        {
          enabledCapabilities: [],
          entitledModulePacks: EVERY_MODULE_PACK,
        },
      ) ?? [];

    expect(marked?.name).toBe(MOCK_NEWSLETTER_TYPE.name);
    expect(marked?.jsonType).toBe('object');
  });

  it.each([
    {
      behaviour: 'every requirement is met',
      types: MOCK_TYPES,
      entitlements: {
        enabledCapabilities: [CAPABILITY.NEWSLETTER],
        entitledModulePacks: EVERY_MODULE_PACK,
      },
    },
    {
      behaviour: 'no capabilities are given and every pack is entitled',
      types: MOCK_TYPES,
      entitlements: { entitledModulePacks: EVERY_MODULE_PACK },
    },
    {
      behaviour: 'no type is gated',
      types: [MOCK_CTA_TYPE],
      entitlements: { enabledCapabilities: [], entitledModulePacks: CORE_ONLY },
    },
  ])('returns null when $behaviour', ({ types, entitlements }) => {
    expect(markRequirementOffTypes(types, entitlements)).toBeNull();
  });
});
