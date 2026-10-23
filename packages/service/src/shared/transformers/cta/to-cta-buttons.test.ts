import { CTA_ACTION_VARIANT } from '@blog/config';
import { mockRawCtaButton } from '@blog/service/testing/modules/fixtures';
import { mockRawInternalLinkDocument } from '@blog/service/testing/shared/fixtures';

import { toCtaButtons } from './to-cta-buttons';

describe(toCtaButtons, () => {
  it.each([null, undefined, []])('returns an empty array for %j', (raw) => {
    const result = toCtaButtons(raw);

    expect(result).toEqual([]);
  });

  it('maps every resolvable button', () => {
    const raw = [
      mockRawCtaButton(),
      mockRawCtaButton({ variant: CTA_ACTION_VARIANT.SECONDARY }),
    ];

    const result = toCtaButtons(raw);

    expect(result).toHaveLength(2);
    expect(result[0]?.variant).toBe(CTA_ACTION_VARIANT.PRIMARY);
    expect(result[1]?.variant).toBe(CTA_ACTION_VARIANT.SECONDARY);
  });

  it('drops entries whose link cannot resolve to an href', () => {
    const raw = [
      mockRawCtaButton({ link: mockRawInternalLinkDocument() }),
      mockRawCtaButton({ variant: CTA_ACTION_VARIANT.SECONDARY }),
    ];

    const result = toCtaButtons(raw);

    expect(result).toHaveLength(1);
    expect(result[0]?.variant).toBe(CTA_ACTION_VARIANT.SECONDARY);
  });
});
