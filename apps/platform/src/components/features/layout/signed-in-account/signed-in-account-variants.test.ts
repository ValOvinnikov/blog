import { buttonVariants } from '@platform/components/shared/button/button-variants';

import {
  SIGN_OUT_BUTTON_BY_SURFACE,
  signedInAccountVariants,
} from './signed-in-account-variants';

const HOVER_BACKGROUND = /(?:^|\s)\S*hover:bg-\S+/g;

describe('rail sign-out button', () => {
  it.each(['rail', 'railFooter'] as const)(
    'keeps a single hover background on the %s surface',
    (surface) => {
      const { variant, size } = SIGN_OUT_BUTTON_BY_SURFACE[surface];
      const { root } = buttonVariants({ variant, size });

      const classes = root({
        class: signedInAccountVariants({ surface }).signOut(),
      });

      expect(classes.match(HOVER_BACKGROUND)).toHaveLength(1);
    },
  );
});
