import { CTA_ACTION_APPEARANCE, CTA_ACTION_VARIANT } from '@blog/config';
import { customRender, screen } from '@web/testing/custom-render';

import {
  ActionGroup,
  toButtonVariant,
  toIsReversedOnDark,
} from './action-group';

const primaryAction = {
  variant: CTA_ACTION_VARIANT.PRIMARY,
  appearance: CTA_ACTION_APPEARANCE.CONTAINED,
  link: {
    label: 'Subscribe now',
    href: '/blog',
    target: undefined,
    platform: undefined,
    ariaLabel: undefined,
  },
};

const secondaryAction = {
  variant: CTA_ACTION_VARIANT.SECONDARY,
  appearance: CTA_ACTION_APPEARANCE.CONTAINED,
  link: {
    label: 'Learn more',
    href: '/about-us',
    target: undefined,
    platform: undefined,
    ariaLabel: 'Learn more about our subscription plans',
  },
};

const setup = customRender(ActionGroup, {
  actions: [primaryAction, secondaryAction],
  isOnDark: undefined,
});

describe(ActionGroup, () => {
  it('renders every action in authored order', () => {
    setup();

    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveTextContent('Subscribe now');
    expect(links[1]).toHaveTextContent('Learn more');
  });

  // Checked against a stub that omits `aria-label` — that version fails
  // this assertion, confirming the test exercises the forwarding rather
  // than passing unconditionally.
  it('forwards the authored ariaLabel to the rendered link accessible name', () => {
    setup();

    expect(
      screen.getByRole('link', {
        name: 'Learn more about our subscription plans',
      }),
    ).toBeVisible();
  });

  it('falls back to the label as the accessible name when no ariaLabel is authored', () => {
    setup();

    expect(screen.getByRole('link', { name: 'Subscribe now' })).toBeVisible();
  });
});

describe(toButtonVariant, () => {
  it('maps a PRIMARY + CONTAINED action to the primary button variant', () => {
    expect(
      toButtonVariant(
        CTA_ACTION_VARIANT.PRIMARY,
        CTA_ACTION_APPEARANCE.CONTAINED,
      ),
    ).toBe('primary');
  });

  it('maps a SECONDARY + CONTAINED action to the ghost button variant', () => {
    expect(
      toButtonVariant(
        CTA_ACTION_VARIANT.SECONDARY,
        CTA_ACTION_APPEARANCE.CONTAINED,
      ),
    ).toBe('ghost');
  });

  it('maps an INLINE appearance action to the link variant regardless of its variant', () => {
    expect(
      toButtonVariant(CTA_ACTION_VARIANT.PRIMARY, CTA_ACTION_APPEARANCE.INLINE),
    ).toBe('link');
    expect(
      toButtonVariant(
        CTA_ACTION_VARIANT.SECONDARY,
        CTA_ACTION_APPEARANCE.INLINE,
      ),
    ).toBe('link');
  });
});

describe(toIsReversedOnDark, () => {
  it('reverses a non-primary button when isOnDark is set', () => {
    expect(toIsReversedOnDark(true, 'ghost')).toBe(true);
  });

  it('leaves the primary button untouched even when isOnDark is set', () => {
    expect(toIsReversedOnDark(true, 'primary')).toBe(false);
  });

  it('does not reverse a non-primary button when isOnDark is not set', () => {
    expect(toIsReversedOnDark(undefined, 'ghost')).toBe(false);
  });
});
