import {
  ALL_ITEMS_TAB,
  filterModulePickerTypes,
  getModulePickerIcon,
  hasModuleMembers,
  isModulePickerSearchShown,
} from '@blog/studio/schema-types/inputs/requirement-warning-input/module-picker/module-picker-filter';
import { ctaSchema } from '@blog/studio/schema-types/modules/cta/cta';
import { faqSchema } from '@blog/studio/schema-types/modules/faq/faq';
import { pricingSchema } from '@blog/studio/schema-types/modules/pricing/pricing';
import { faker } from '@faker-js/faker';
import type { ComponentType } from 'react';
import type { SchemaType } from 'sanity';

faker.seed(6569);

const MOCK_GROUP = faker.lorem.word();
const MOCK_TITLE = faker.lorem.words(3);
const MOCK_ICON: ComponentType = () => null;
const MOCK_TARGET_ICON: ComponentType = () => null;

const asSchemaType = (type: object) => type as SchemaType;

const CTA_TYPE = asSchemaType({ name: ctaSchema.name, title: MOCK_TITLE });
const FAQ_TYPE = asSchemaType({ name: faqSchema.name });
const PRICING_TYPE = asSchemaType({ name: pricingSchema.name });
const TYPES = [CTA_TYPE, PRICING_TYPE, FAQ_TYPE];
const GROUPS = [{ name: MOCK_GROUP, of: [FAQ_TYPE.name, CTA_TYPE.name] }];

describe(filterModulePickerTypes, () => {
  it('keeps every type, in order, on the all tab', () => {
    expect(
      filterModulePickerTypes({
        types: TYPES,
        groups: GROUPS,
        tab: ALL_ITEMS_TAB,
        query: '',
      }),
    ).toEqual(TYPES);
  });

  it("keeps only a group's types, in the field's order, on its tab", () => {
    expect(
      filterModulePickerTypes({
        types: TYPES,
        groups: GROUPS,
        tab: MOCK_GROUP,
        query: '',
      }),
    ).toEqual([CTA_TYPE, FAQ_TYPE]);
  });

  it('matches the search against the title, in any case', () => {
    expect(
      filterModulePickerTypes({
        types: TYPES,
        groups: GROUPS,
        tab: MOCK_GROUP,
        query: ` ${MOCK_TITLE.toUpperCase()} `,
      }),
    ).toEqual([CTA_TYPE]);
  });

  it('matches the search against the name of an untitled type', () => {
    expect(
      filterModulePickerTypes({
        types: TYPES,
        tab: ALL_ITEMS_TAB,
        query: pricingSchema.name,
      }),
    ).toEqual([PRICING_TYPE]);
  });

  it('keeps nothing when the search matches no type on the tab', () => {
    expect(
      filterModulePickerTypes({
        types: TYPES,
        groups: GROUPS,
        tab: MOCK_GROUP,
        query: pricingSchema.name,
      }),
    ).toEqual([]);
  });
});

describe(isModulePickerSearchShown, () => {
  it.each([
    { filter: undefined, typeCount: 5, expected: false },
    { filter: undefined, typeCount: 6, expected: true },
    { filter: 'auto' as const, typeCount: 6, expected: true },
    { filter: false, typeCount: 6, expected: false },
    { filter: true, typeCount: 1, expected: true },
  ])(
    'shows the search with filter $filter and $typeCount types: $expected',
    ({ filter, typeCount, expected }) => {
      expect(isModulePickerSearchShown(filter, typeCount)).toBe(expected);
    },
  );
});

describe(getModulePickerIcon, () => {
  const reference = { name: 'reference' };

  it('uses the icon of the one type a reference points to', () => {
    const type = asSchemaType({
      name: ctaSchema.name,
      type: reference,
      to: [{ name: ctaSchema.name, icon: MOCK_TARGET_ICON }],
    });

    expect(getModulePickerIcon(type)).toBe(MOCK_TARGET_ICON);
  });

  it("prefers the type's own icon", () => {
    const type = asSchemaType({
      name: ctaSchema.name,
      icon: MOCK_ICON,
      type: reference,
      to: [{ name: ctaSchema.name, icon: MOCK_TARGET_ICON }],
    });

    expect(getModulePickerIcon(type)).toBe(MOCK_ICON);
  });

  it('has no icon for a reference to several types', () => {
    const type = asSchemaType({
      name: ctaSchema.name,
      type: reference,
      to: [
        { name: ctaSchema.name, icon: MOCK_TARGET_ICON },
        { name: faqSchema.name, icon: MOCK_ICON },
      ],
    });

    expect(getModulePickerIcon(type)).toBeUndefined();
  });
});

describe(hasModuleMembers, () => {
  it.each([
    { members: 'modules', types: TYPES, expected: true },
    {
      members: 'other types',
      types: [asSchemaType({ name: MOCK_GROUP })],
      expected: false,
    },
    { members: 'nothing', types: [], expected: false },
  ])('is $expected for an array of $members', ({ types, expected }) => {
    expect(hasModuleMembers(types)).toBe(expected);
  });
});
