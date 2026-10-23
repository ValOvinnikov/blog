import {
  mockCtaButtonView,
  mockRawCtaButton,
} from '@blog/service/testing/modules/fixtures';
import { mockRawInternalLinkDocument } from '@blog/service/testing/shared/fixtures';

import { toCtaButton } from './to-cta-button';

describe(toCtaButton, () => {
  it('maps variant, appearance and a resolved link', () => {
    const button = toCtaButton(mockRawCtaButton());

    expect(button).toEqual(mockCtaButtonView());
  });

  it('leaves appearance undefined when unset', () => {
    const button = toCtaButton(mockRawCtaButton({ appearance: null }));

    expect(button?.appearance).toBeUndefined();
  });

  it('returns undefined when the link cannot resolve to an href', () => {
    const button = toCtaButton(
      mockRawCtaButton({ link: mockRawInternalLinkDocument() }),
    );

    expect(button).toBeUndefined();
  });
});
