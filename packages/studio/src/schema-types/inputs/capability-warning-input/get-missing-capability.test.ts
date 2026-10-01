import { CAPABILITY } from '@blog/config/constants';

import { getMissingCapability } from './get-missing-capability';

describe(getMissingCapability, () => {
  it('returns the capability when the list lacks it', () => {
    expect(
      getMissingCapability('module_newsletter', [CAPABILITY.COMMENTS]),
    ).toBe(CAPABILITY.NEWSLETTER);
  });

  it('returns the capability when the list is empty', () => {
    expect(getMissingCapability('module_newsletter', [])).toBe(
      CAPABILITY.NEWSLETTER,
    );
  });

  it('returns null when the capability is enabled', () => {
    expect(
      getMissingCapability('module_newsletter', [CAPABILITY.NEWSLETTER]),
    ).toBeNull();
  });

  it('returns null when no list is given', () => {
    expect(getMissingCapability('module_newsletter', undefined)).toBeNull();
  });

  it('returns null for a type that needs no capability', () => {
    expect(getMissingCapability('module_cta', [])).toBeNull();
  });
});
