import { CAPABILITY, MODULE_PACK } from '@blog/config/constants';
import { getMissingRequirement } from '@blog/studio/schema-types/inputs/requirement-warning-input/get-missing-requirement';
import { EVERY_MODULE_PACK } from '@blog/studio/schema-types/validation/entitled-module-packs/entitled-module-packs';

const NEWSLETTER_MODULE_TYPE = 'module_newsletter';
const CONTACT_FORM_MODULE_TYPE = 'module_contactForm';
const CORE_ONLY = [MODULE_PACK.CORE];

describe(getMissingRequirement, () => {
  it.each([
    {
      behaviour: 'returns the capability when the list lacks it',
      typeName: NEWSLETTER_MODULE_TYPE,
      enabledCapabilities: [CAPABILITY.COMMENTS],
      entitledModulePacks: EVERY_MODULE_PACK,
      expected: { capability: CAPABILITY.NEWSLETTER },
    },
    {
      behaviour: 'returns the capability when the list is empty',
      typeName: NEWSLETTER_MODULE_TYPE,
      enabledCapabilities: [],
      entitledModulePacks: EVERY_MODULE_PACK,
      expected: { capability: CAPABILITY.NEWSLETTER },
    },
    {
      behaviour: 'returns null when the capability is enabled',
      typeName: NEWSLETTER_MODULE_TYPE,
      enabledCapabilities: [CAPABILITY.NEWSLETTER],
      entitledModulePacks: EVERY_MODULE_PACK,
      expected: null,
    },
    {
      behaviour: 'returns null when no capability list is given',
      typeName: NEWSLETTER_MODULE_TYPE,
      enabledCapabilities: undefined,
      entitledModulePacks: EVERY_MODULE_PACK,
      expected: null,
    },
    {
      behaviour: 'returns null for a core module on core alone',
      typeName: 'module_cta',
      enabledCapabilities: [],
      entitledModulePacks: CORE_ONLY,
      expected: null,
    },
    {
      behaviour: 'returns the module pack a growth module needs on core alone',
      typeName: 'module_pricing',
      enabledCapabilities: undefined,
      entitledModulePacks: CORE_ONLY,
      expected: { modulePack: MODULE_PACK.GROWTH },
    },
    {
      behaviour: 'prefers the module pack when the capability is off too',
      typeName: CONTACT_FORM_MODULE_TYPE,
      enabledCapabilities: [],
      entitledModulePacks: CORE_ONLY,
      expected: { modulePack: MODULE_PACK.GROWTH },
    },
    {
      behaviour:
        'returns the capability for an entitled module whose capability is off',
      typeName: CONTACT_FORM_MODULE_TYPE,
      enabledCapabilities: [],
      entitledModulePacks: EVERY_MODULE_PACK,
      expected: { capability: CAPABILITY.CONTACT_FORM },
    },
    {
      behaviour: 'returns null for a type that is not a module',
      typeName: 'page_home',
      enabledCapabilities: [],
      entitledModulePacks: [],
      expected: null,
    },
  ])(
    '$behaviour',
    ({ typeName, enabledCapabilities, entitledModulePacks, expected }) => {
      expect(
        getMissingRequirement(typeName, {
          enabledCapabilities,
          entitledModulePacks,
        }),
      ).toEqual(expected);
    },
  );
});
