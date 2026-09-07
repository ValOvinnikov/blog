import {
  CTA_ACTION_APPEARANCE,
  CTA_ACTION_VARIANT,
  LINK_TYPE,
} from '@blog/config';
import { makeRawCtaAction } from '@blog/service/testing/modules/fixtures';

import { toCtaAction } from './to-cta-action';

describe(toCtaAction, () => {
  it('maps variant, appearance and a resolved link', () => {
    const action = toCtaAction(makeRawCtaAction());

    expect(action).toEqual({
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
    const action = toCtaAction(makeRawCtaAction({ appearance: null }));

    expect(action?.appearance).toBeUndefined();
  });

  it('returns undefined when the link cannot resolve to an href', () => {
    const action = toCtaAction(
      makeRawCtaAction({
        link: {
          label: 'Broken',
          linkType: LINK_TYPE.INTERNAL,
          url: null,
          internalReference: null,
          openInNewTab: null,
          platform: null,
          accessibleLabel: null,
        },
      }),
    );

    expect(action).toBeUndefined();
  });
});
