import { CAPABILITY, type TCapability } from '@blog/config/constants';

const CAPABILITY_BY_TYPE: Readonly<Record<string, TCapability>> = {
  module_newsletter: CAPABILITY.NEWSLETTER,
};

const CAPABILITY_LABEL: Readonly<Record<TCapability, string>> = {
  [CAPABILITY.COMMENTS]: 'Comments',
  [CAPABILITY.RATINGS]: 'Ratings',
  [CAPABILITY.BOOKMARKS]: 'Bookmarks',
  [CAPABILITY.NEWSLETTER]: 'Newsletter',
  [CAPABILITY.ANALYTICS]: 'Analytics',
  [CAPABILITY.CONSENT_BANNER]: 'Consent banner',
};

export const getMissingCapability = (
  typeName: string,
  enabledCapabilities: readonly TCapability[] | undefined,
): TCapability | null => {
  const required = CAPABILITY_BY_TYPE[typeName];

  if (!required || !enabledCapabilities) {
    return null;
  }

  return enabledCapabilities.includes(required) ? null : required;
};

export const getCapabilityOffMessage = (capability: TCapability) =>
  `This won't appear on the site until ${CAPABILITY_LABEL[capability]} is turned on in Features.`;
