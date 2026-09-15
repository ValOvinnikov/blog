import {
  CTA_ACTION_APPEARANCE,
  CTA_ACTION_VARIANT,
  LINK_TYPE,
} from '@blog/config';
import { makeRawCtaButton } from '@blog/service/testing/modules/fixtures';

import { toCtaButton } from './to-cta-button';

describe(toCtaButton, () => {
  it('maps variant, appearance and a resolved link', () => {
    const button = toCtaButton(makeRawCtaButton());

    expect(button).toEqual({
      variant: CTA_ACTION_VARIANT.PRIMARY,
      appearance: CTA_ACTION_APPEARANCE.CONTAINED,
      link: {
        label: 'Subscribe',
        href: '/newsletter',
        target: undefined,
        platform: undefined,
        ariaLabel: undefined,
      },
    });
  });

  it('leaves appearance undefined when unset', () => {
    const button = toCtaButton(makeRawCtaButton({ appearance: null }));

    expect(button?.appearance).toBeUndefined();
  });

  it('returns undefined when the link cannot resolve to an href', () => {
    const button = toCtaButton(
      makeRawCtaButton({
        link: {
          label: 'Broken',
          linkType: LINK_TYPE.INTERNAL,
          internalReference: null,
          url: null,
          openInNewTab: null,
        },
      }),
    );

    expect(button).toBeUndefined();
  });
});
