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
  },
};

const setup = customRender(ActionGroup, {
  actions: [primaryAction, secondaryAction],
  isOnDark: undefined,
});

describe(`<${ActionGroup.name}/>`, () => {
  it('renders every action in authored order', () => {
    setup();

    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveTextContent('Subscribe now');
    expect(links[1]).toHaveTextContent('Learn more');
  });

  it('uses the authored label as the accessible name', () => {
    setup();

    expect(screen.getByRole('link', { name: 'Learn more' })).toBeVisible();
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

describe('ActionGroup — hiddenLabelSuffix', () => {
  const actionWithSuffix = {
    variant: CTA_ACTION_VARIANT.PRIMARY,
    appearance: undefined,
    link: {
      label: 'Read more',
      href: '/blog/welcome-to-the-blog',
      target: undefined,
      platform: undefined,
    },
    hiddenLabelSuffix: 'Welcome to the blog',
  };

  const hiddenLabelSetup = customRender(ActionGroup, {
    actions: [actionWithSuffix],
    isOnDark: undefined,
  });

  it('renders a hiddenLabelSuffix as real (sr-only) text inside the accessible name', () => {
    hiddenLabelSetup();

    const link = screen.getByRole('link', {
      name: 'Read more: Welcome to the blog',
    });
    expect(link).toBeVisible();
    expect(link).toHaveTextContent('Read more: Welcome to the blog');
  });

  it('renders no suffix when hiddenLabelSuffix is unset', () => {
    hiddenLabelSetup({
      actions: [{ ...actionWithSuffix, hiddenLabelSuffix: undefined }],
    });

    const link = screen.getByRole('link', { name: 'Read more' });
    expect(link).toBeVisible();
    expect(link).toHaveTextContent('Read more');
  });
});
