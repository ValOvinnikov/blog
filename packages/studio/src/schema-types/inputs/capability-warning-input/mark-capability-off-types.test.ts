import { CAPABILITY } from '@blog/config/constants';

import { markCapabilityOffTypes } from './mark-capability-off-types';

const cta = { name: 'module_cta', title: 'CTA' };
const newsletter = { name: 'module_newsletter', title: 'Newsletter' };
const types = [cta, newsletter];

describe(markCapabilityOffTypes, () => {
  it('marks a gated type whose capability is off', () => {
    const marked = markCapabilityOffTypes(types, [CAPABILITY.COMMENTS]);

    expect(marked?.map(({ name, title }) => [name, title])).toEqual([
      ['module_cta', 'CTA'],
      ['module_newsletter', 'Newsletter (off in Features)'],
    ]);
  });

  it('keeps every other property of the marked type', () => {
    const [, marked] =
      markCapabilityOffTypes(
        [cta, { ...newsletter, jsonType: 'object' }],
        [],
      ) ?? [];

    expect(marked).toMatchObject({
      name: 'module_newsletter',
      jsonType: 'object',
    });
  });

  it('returns null when the capability is on', () => {
    expect(markCapabilityOffTypes(types, [CAPABILITY.NEWSLETTER])).toBeNull();
  });

  it('returns null when no capabilities are given', () => {
    expect(markCapabilityOffTypes(types, undefined)).toBeNull();
  });

  it('returns null when no type is gated', () => {
    expect(markCapabilityOffTypes([cta], [])).toBeNull();
  });
});
