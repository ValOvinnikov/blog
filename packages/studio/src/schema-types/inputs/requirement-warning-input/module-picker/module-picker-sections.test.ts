import { MODULE_PACK } from '@blog/config/constants';
import {
  getModulePickerSections,
  getOffPlanModulePack,
} from '@blog/studio/schema-types/inputs/requirement-warning-input/module-picker/module-picker-sections';
import { contactFormSchema } from '@blog/studio/schema-types/modules/contact-form/contact-form';
import { ctaSchema } from '@blog/studio/schema-types/modules/cta/cta';
import { faqSchema } from '@blog/studio/schema-types/modules/faq/faq';
import { newsletterSchema } from '@blog/studio/schema-types/modules/newsletter/newsletter';
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
const TYPES = [CTA_TYPE, PRICING_TYPE, FAQ_TYPE];
const GROUPS = [
  { name: MOCK_GROUP, of: [CTA_TYPE.name, PRICING_TYPE.name, FAQ_TYPE.name] },
];

describe(getModulePickerSections, () => {
  it('keeps every module in its group, in order', () => {
    const sections = getModulePickerSections({
      types: TYPES,
      groups: GROUPS,
      query: '',
    });

    expect(sections.map(({ name, types }) => [name, types])).toEqual([
      [MOCK_GROUP, TYPES],
    ]);
  });

  it('restores a locked module to its place when the list puts it last', () => {
    const contactFormType = { name: contactFormSchema.name };
    const newsletterType = { name: newsletterSchema.name };
    const sections = getModulePickerSections({
      types: [CTA_TYPE, newsletterType, contactFormType],
      groups: [
        {
          name: MOCK_GROUP,
          of: [CTA_TYPE.name, contactFormType.name, newsletterType.name],
        },
      ],
      query: '',
    });

    expect(sections.map(({ types }) => types)).toEqual([
      [CTA_TYPE, contactFormType, newsletterType],
    ]);
  });

  it('lists a module no group names in an untitled section', () => {
    const sections = getModulePickerSections({
      types: [CTA_TYPE, MOCK_UNGROUPED_TYPE],
      groups: GROUPS,
      query: '',
    });

    expect(sections.map(({ title, types }) => [title, types])).toEqual([
      [MOCK_GROUP, [CTA_TYPE]],
      [undefined, [MOCK_UNGROUPED_TYPE]],
    ]);
  });

  it('keeps only modules whose title matches the search, in any case', () => {
    const sections = getModulePickerSections({
      types: TYPES,
      groups: GROUPS,
      query: ` ${getModuleTitle(PRICING_TYPE.name).toUpperCase()} `,
    });

    expect(sections.map(({ types }) => types)).toEqual([[PRICING_TYPE]]);
  });

  it('returns no section when nothing matches the search', () => {
    expect(
      getModulePickerSections({
        types: TYPES,
        groups: GROUPS,
        query: faker.string.alphanumeric(24),
      }),
    ).toEqual([]);
  });
});

describe(getOffPlanModulePack, () => {
  it.each([
    {
      packs: 'core alone',
      entitledModulePacks: [MODULE_PACK.CORE],
      expected: MODULE_PACK.GROWTH,
    },
    {
      packs: 'every pack',
      entitledModulePacks: EVERY_MODULE_PACK,
      expected: undefined,
    },
  ])(
    'finds the pack a module is missing on $packs',
    ({ entitledModulePacks, expected }) => {
      expect(getOffPlanModulePack(TYPES, entitledModulePacks)).toBe(expected);
    },
  );
});
