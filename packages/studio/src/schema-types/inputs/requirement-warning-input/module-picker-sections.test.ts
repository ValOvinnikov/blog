import { MODULE_PACK } from '@blog/config/constants';
import {
  getModulePickerSections,
  hasOffPlanModuleType,
} from '@blog/studio/schema-types/inputs/requirement-warning-input/module-picker-sections';
import { ctaSchema } from '@blog/studio/schema-types/modules/cta/cta';
import { faqSchema } from '@blog/studio/schema-types/modules/faq/faq';
import { pricingSchema } from '@blog/studio/schema-types/modules/pricing/pricing';
import { EVERY_MODULE_PACK } from '@blog/studio/schema-types/validation/entitled-module-packs/entitled-module-packs';
import { getModuleTitle } from '@blog/studio/structure/module-kinds/module-kinds';
import { faker } from '@faker-js/faker';

faker.seed(6569);

const MOCK_GROUP = faker.lorem.word();
const MOCK_UNGROUPED_TYPE = { name: faker.lorem.word() };
const CTA_TYPE = { name: ctaSchema.name };
const FAQ_TYPE = { name: faqSchema.name };
const PRICING_TYPE = { name: pricingSchema.name };
const TYPES = [CTA_TYPE, FAQ_TYPE, PRICING_TYPE];
const GROUPS = [
  { name: MOCK_GROUP, of: [CTA_TYPE.name, FAQ_TYPE.name, PRICING_TYPE.name] },
];
const CORE_ONLY = [MODULE_PACK.CORE];

const sectionNames = (
  sections: ReturnType<typeof getModulePickerSections>['sections'],
) => sections.map(({ name, types }) => [name, types]);

describe(getModulePickerSections, () => {
  it('moves off-plan modules out of their group', () => {
    const { sections, offPlan } = getModulePickerSections({
      types: TYPES,
      groups: GROUPS,
      entitledModulePacks: CORE_ONLY,
      query: '',
    });

    expect(sectionNames(sections)).toEqual([
      [MOCK_GROUP, [CTA_TYPE, FAQ_TYPE]],
    ]);
    expect(offPlan).toEqual([PRICING_TYPE]);
  });

  it('keeps every module in its group when every pack is entitled', () => {
    const { sections, offPlan } = getModulePickerSections({
      types: TYPES,
      groups: GROUPS,
      entitledModulePacks: EVERY_MODULE_PACK,
      query: '',
    });

    expect(sectionNames(sections)).toEqual([[MOCK_GROUP, TYPES]]);
    expect(offPlan).toEqual([]);
  });

  it('lists a module no group names in an untitled section', () => {
    const { sections } = getModulePickerSections({
      types: [CTA_TYPE, MOCK_UNGROUPED_TYPE],
      groups: GROUPS,
      entitledModulePacks: CORE_ONLY,
      query: '',
    });

    expect(sections.map(({ title, types }) => [title, types])).toEqual([
      [MOCK_GROUP, [CTA_TYPE]],
      [undefined, [MOCK_UNGROUPED_TYPE]],
    ]);
  });

  it('keeps only modules whose title matches the search, in any case', () => {
    const { sections, offPlan } = getModulePickerSections({
      types: TYPES,
      groups: GROUPS,
      entitledModulePacks: CORE_ONLY,
      query: ` ${getModuleTitle(PRICING_TYPE.name).toUpperCase()} `,
    });

    expect(sections).toEqual([]);
    expect(offPlan).toEqual([PRICING_TYPE]);
  });
});

describe(hasOffPlanModuleType, () => {
  it.each([
    { packs: 'core alone', entitledModulePacks: CORE_ONLY, expected: true },
    {
      packs: 'every pack',
      entitledModulePacks: EVERY_MODULE_PACK,
      expected: false,
    },
  ])(
    'finds a growth module on $packs: $expected',
    ({ entitledModulePacks, expected }) => {
      expect(hasOffPlanModuleType(TYPES, entitledModulePacks)).toBe(expected);
    },
  );
});
