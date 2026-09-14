import { CTA_ACTION_APPEARANCE, CTA_ACTION_VARIANT } from '@blog/config';

import { toActionGroupAction } from './to-action-group-action';

describe(toActionGroupAction, () => {
  it('carries the action through unchanged, adding the given hiddenLabelSuffix', () => {
    const action = {
      variant: CTA_ACTION_VARIANT.PRIMARY,
      appearance: CTA_ACTION_APPEARANCE.CONTAINED,
      link: {
        label: 'Learn more',
        href: '/about-us',
        target: undefined,
        platform: undefined,
      },
    };

    expect(toActionGroupAction(action, 'Get started')).toEqual({
      ...action,
      hiddenLabelSuffix: 'Get started',
    });
  });
});
