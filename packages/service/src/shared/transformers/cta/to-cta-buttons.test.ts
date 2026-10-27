import { CTA_ACTION_VARIANT } from '@blog/config';
import {
  mockCtaButtonView,
  mockRawCtaButton,
} from '@blog/service/testing/modules/fixtures';
import { mockRawInternalLinkDocument } from '@blog/service/testing/shared/fixtures';

import { toCtaButtons } from './to-cta-buttons';

describe(toCtaButtons, () => {
  it.each([null, undefined, []])('returns an empty array for %j', (raw) => {
    const result = toCtaButtons(raw);

    expect(result).toEqual([]);
  });

  it('maps every resolvable button', () => {
    const result = toCtaButtons([
      mockRawCtaButton(),
      mockRawCtaButton({ variant: CTA_ACTION_VARIANT.SECONDARY }),
    ]);

    expect(result).toEqual([
      mockCtaButtonView(),
      mockCtaButtonView({ variant: CTA_ACTION_VARIANT.SECONDARY }),
    ]);
  });

  it('drops entries whose link cannot resolve to an href', () => {
    const result = toCtaButtons([
      mockRawCtaButton({ link: mockRawInternalLinkDocument() }),
      mockRawCtaButton({ variant: CTA_ACTION_VARIANT.SECONDARY }),
    ]);

    expect(result).toEqual([
      mockCtaButtonView({ variant: CTA_ACTION_VARIANT.SECONDARY }),
    ]);
  });
});
