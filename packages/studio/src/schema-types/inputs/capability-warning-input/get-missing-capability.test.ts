import { CAPABILITY } from '@blog/config/constants';
import { getMissingCapability } from '@blog/studio/schema-types/inputs/capability-warning-input/get-missing-capability';

const NEWSLETTER_MODULE_TYPE = 'module_newsletter';

describe(getMissingCapability, () => {
  it.each([
    {
      behaviour: 'returns the capability when the list lacks it',
      typeName: NEWSLETTER_MODULE_TYPE,
      enabled: [CAPABILITY.COMMENTS],
      expected: CAPABILITY.NEWSLETTER,
    },
    {
      behaviour: 'returns the capability when the list is empty',
      typeName: NEWSLETTER_MODULE_TYPE,
      enabled: [],
      expected: CAPABILITY.NEWSLETTER,
    },
    {
      behaviour: 'returns null when the capability is enabled',
      typeName: NEWSLETTER_MODULE_TYPE,
      enabled: [CAPABILITY.NEWSLETTER],
      expected: null,
    },
    {
      behaviour: 'returns null when no list is given',
      typeName: NEWSLETTER_MODULE_TYPE,
      enabled: undefined,
      expected: null,
    },
    {
      behaviour: 'returns null for a type that needs no capability',
      typeName: 'module_cta',
      enabled: [],
      expected: null,
    },
  ])('$behaviour', ({ typeName, enabled, expected }) => {
    expect(getMissingCapability(typeName, enabled)).toBe(expected);
  });
});
