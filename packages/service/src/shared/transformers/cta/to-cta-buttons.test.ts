import { CTA_ACTION_VARIANT, LINK_TYPE } from '@blog/config';
import { makeRawCtaButton } from '@blog/service/testing/modules/fixtures';

import { toCtaButtons } from './to-cta-buttons';

describe(toCtaButtons, () => {
  it('returns an empty array for a null/undefined raw list', () => {
    expect(toCtaButtons(null)).toEqual([]);
    expect(toCtaButtons(undefined)).toEqual([]);
  });

  it('returns an empty array for an empty raw list', () => {
    expect(toCtaButtons([])).toEqual([]);
  });

  it('maps every resolvable button', () => {
    const raw = [
      makeRawCtaButton(),
      makeRawCtaButton({ variant: CTA_ACTION_VARIANT.SECONDARY }),
    ];

    const result = toCtaButtons(raw);

    expect(result).toHaveLength(2);
    expect(result[0]?.variant).toBe(CTA_ACTION_VARIANT.PRIMARY);
    expect(result[1]?.variant).toBe(CTA_ACTION_VARIANT.SECONDARY);
  });

  it('drops entries whose link cannot resolve to an href', () => {
    const raw = [
      makeRawCtaButton({
        link: {
          label: 'Broken',
          linkType: LINK_TYPE.INTERNAL,
          internalReference: null,
          url: null,
          openInNewTab: null,
        },
      }),
      makeRawCtaButton({ variant: CTA_ACTION_VARIANT.SECONDARY }),
    ];

    const result = toCtaButtons(raw);

    expect(result).toHaveLength(1);
    expect(result[0]?.variant).toBe(CTA_ACTION_VARIANT.SECONDARY);
  });
});
