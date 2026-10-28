import {
  CAPABILITY,
  getModulePack,
  isModuleTypeEntitled,
  MODULE_PACK,
  type TCapability,
  type TModulePack,
} from '@blog/config/constants';
import type { TMaybeNull } from '@blog/config/types';

export type TRequirement =
  { capability: TCapability } | { modulePack: TModulePack };

export type TEntitlementState = {
  enabledCapabilities?: readonly TCapability[];
  entitledModulePacks: readonly TModulePack[];
};

const CAPABILITY_BY_TYPE: Readonly<Record<string, TCapability>> = {
  module_newsletter: CAPABILITY.NEWSLETTER,
  module_contactForm: CAPABILITY.CONTACT_FORM,
};

const CAPABILITY_LABEL: Readonly<Record<TCapability, string>> = {
  [CAPABILITY.COMMENTS]: 'Comments',
  [CAPABILITY.RATINGS]: 'Ratings',
  [CAPABILITY.BOOKMARKS]: 'Bookmarks',
  [CAPABILITY.NEWSLETTER]: 'Newsletter',
  [CAPABILITY.ANALYTICS]: 'Analytics',
  [CAPABILITY.CONSENT_BANNER]: 'Consent banner',
  [CAPABILITY.CONTACT_FORM]: 'Contact form',
};

const MODULE_PACK_LABEL: Readonly<Record<TModulePack, string>> = {
  [MODULE_PACK.CORE]: 'Core',
  [MODULE_PACK.GROWTH]: 'Growth',
};

export const getMissingModulePack = (
  typeName: string,
  entitledModulePacks: readonly TModulePack[],
): TMaybeNull<TModulePack> => {
  const modulePack = getModulePack(typeName);

  return modulePack && !isModuleTypeEntitled(typeName, entitledModulePacks)
    ? modulePack
    : null;
};

const getMissingCapability = (
  typeName: string,
  enabledCapabilities: TEntitlementState['enabledCapabilities'],
): TMaybeNull<TCapability> => {
  const required = CAPABILITY_BY_TYPE[typeName];

  if (!required || !enabledCapabilities) {
    return null;
  }

  return enabledCapabilities.includes(required) ? null : required;
};

export const getMissingRequirement = (
  typeName: string,
  { enabledCapabilities, entitledModulePacks }: TEntitlementState,
): TMaybeNull<TRequirement> => {
  const modulePack = getMissingModulePack(typeName, entitledModulePacks);
  if (modulePack) {
    return { modulePack };
  }

  const capability = getMissingCapability(typeName, enabledCapabilities);

  return capability ? { capability } : null;
};

export const getModulePackOffMessage = (modulePack: TModulePack) =>
  `This module is part of the ${MODULE_PACK_LABEL[modulePack]} plan. It stays saved, but the site won't show it on your current plan.`;

export const getRequirementOffMessage = (requirement: TRequirement) =>
  'modulePack' in requirement
    ? getModulePackOffMessage(requirement.modulePack)
    : `This won't appear on the site until ${CAPABILITY_LABEL[requirement.capability]} is turned on in Features.`;

export const getRequirementOffSuffix = (requirement: TRequirement) =>
  'modulePack' in requirement
    ? `(${MODULE_PACK_LABEL[requirement.modulePack]} plan)`
    : '(off in Features)';
