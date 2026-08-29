import { CTA_ACTION_APPEARANCE, CTA_ACTION_VARIANT } from '@blog/config';
import { customRender, screen } from '@web/testing/custom-render';

import { ActionGroup } from './action-group';

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

  // Regression for #1861: CtaModuleView used to build its action link
  // straight from `SmartLink`, silently dropping the authored `ariaLabel`.
  // Verified against a pre-fix stub omitting `aria-label` — that version
  // fails this assertion (no accessible name match), confirming the test
  // actually exercises the fix rather than passing unconditionally.
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

  it('maps a PRIMARY + CONTAINED action to the primary button treatment', () => {
    setup();

    expect(screen.getByRole('link', { name: 'Subscribe now' })).toHaveClass(
      'bg-brand-primary-solid',
    );
  });

  it('maps a SECONDARY + CONTAINED action to the ghost button treatment', () => {
    setup();

    expect(
      screen.getByRole('link', {
        name: 'Learn more about our subscription plans',
      }),
    ).toHaveClass('border-border-strong');
  });

  it('maps an INLINE appearance action (either variant) to the link button treatment', () => {
    setup({
      actions: [
        {
          ...primaryAction,
          appearance: CTA_ACTION_APPEARANCE.INLINE,
        },
      ],
    });

    expect(screen.getByRole('link', { name: 'Subscribe now' })).toHaveClass(
      'underline',
    );
  });

  it('reverses non-primary buttons to white when isOnDark is set, leaving primary untouched', () => {
    setup({ isOnDark: true });

    expect(screen.getByRole('link', { name: 'Subscribe now' })).not.toHaveClass(
      'text-white',
    );
    expect(
      screen.getByRole('link', {
        name: 'Learn more about our subscription plans',
      }),
    ).toHaveClass('text-white');
  });
});
