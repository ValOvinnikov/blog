import { makeEnTranslator } from '@platform/testing/en-translator';

const tPinned = makeEnTranslator('pinnedTenants');

export const pinLabelsFor = (name: string) => ({
  pinLabel: tPinned('pinAriaLabel', { name }),
  unpinLabel: tPinned('unpinAriaLabel', { name }),
});
