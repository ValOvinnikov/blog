import { CAPABILITY } from '@blog/config/constants';
import { markCapabilityOffTypes } from '@blog/studio/schema-types/inputs/capability-warning-input/mark-capability-off-types';
import { faker } from '@faker-js/faker';

faker.seed(4107);

const MOCK_CTA_TITLE = faker.lorem.word();
const MOCK_NEWSLETTER_TITLE = faker.lorem.word();
const MOCK_CTA_TYPE = { name: 'module_cta', title: MOCK_CTA_TITLE };
const MOCK_NEWSLETTER_TYPE = {
  name: 'module_newsletter',
  title: MOCK_NEWSLETTER_TITLE,
};
const MOCK_TYPES = [MOCK_CTA_TYPE, MOCK_NEWSLETTER_TYPE];

describe(markCapabilityOffTypes, () => {
  it('marks a gated type whose capability is off', () => {
    const marked = markCapabilityOffTypes(MOCK_TYPES, [CAPABILITY.COMMENTS]);

    expect(marked?.map(({ name, title }) => [name, title])).toEqual([
      [MOCK_CTA_TYPE.name, MOCK_CTA_TITLE],
      [MOCK_NEWSLETTER_TYPE.name, `${MOCK_NEWSLETTER_TITLE} (off in Features)`],
    ]);
  });

  it('keeps every other property of the marked type', () => {
    const [marked] =
      markCapabilityOffTypes(
        [{ ...MOCK_NEWSLETTER_TYPE, jsonType: 'object' }],
        [],
      ) ?? [];

    expect(marked?.name).toBe(MOCK_NEWSLETTER_TYPE.name);
    expect(marked?.jsonType).toBe('object');
  });

  it.each([
    {
      behaviour: 'the capability is on',
      types: MOCK_TYPES,
      enabled: [CAPABILITY.NEWSLETTER],
    },
    {
      behaviour: 'no capabilities are given',
      types: MOCK_TYPES,
      enabled: undefined,
    },
    { behaviour: 'no type is gated', types: [MOCK_CTA_TYPE], enabled: [] },
  ])('returns null when $behaviour', ({ types, enabled }) => {
    expect(markCapabilityOffTypes(types, enabled)).toBeNull();
  });
});
