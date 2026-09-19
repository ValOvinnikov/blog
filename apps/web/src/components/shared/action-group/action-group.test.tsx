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

describe(`<${ActionGroup.name}/>`, () => {
  it('renders every action in authored order', () => {
    setup();

    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveTextContent('Subscribe now');
    expect(links[1]).toHaveTextContent('Learn more');
  });

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

  it('renders a PRIMARY + CONTAINED action with the primary button styling', () => {
    setup();

    expect(
      screen.getByRole('link', { name: 'Subscribe now' }).className,
    ).toContain('bg-brand-primary-solid');
  });

  it('renders a SECONDARY + CONTAINED action with the ghost button styling', () => {
    setup();

    expect(
      screen.getByRole('link', {
        name: 'Learn more about our subscription plans',
      }).className,
    ).toContain('border-border-strong');
  });

  it.each([
    { action: primaryAction, name: 'Subscribe now' },
    {
      action: secondaryAction,
      name: 'Learn more about our subscription plans',
    },
  ])(
    'renders an INLINE appearance action with link styling regardless of its cta variant ($name)',
    ({ action, name }) => {
      const inlineSetup = customRender(ActionGroup, {
        actions: [{ ...action, appearance: CTA_ACTION_APPEARANCE.INLINE }],
        isOnDark: undefined,
      });
      inlineSetup();

      expect(screen.getByRole('link', { name }).className).toContain(
        'underline',
      );
    },
  );

  it('gives a CONTAINED action a full-width phone layout and a minimum width from sm up', () => {
    setup();

    const className = screen.getByRole('link', {
      name: 'Subscribe now',
    }).className;
    expect(className).toContain('w-full');
    expect(className).toContain('sm:w-auto');
    expect(className).toContain('sm:min-w-32');
  });

  it('exempts an INLINE appearance action from the minimum width', () => {
    const inlineSetup = customRender(ActionGroup, {
      actions: [{ ...primaryAction, appearance: CTA_ACTION_APPEARANCE.INLINE }],
      isOnDark: undefined,
    });
    inlineSetup();

    const className = screen.getByRole('link', {
      name: 'Subscribe now',
    }).className;
    expect(className).toContain('sm:min-w-0');
    expect(className).not.toContain('sm:min-w-32');
  });

  it('reverses a non-primary action styling on a dark background', () => {
    const darkSetup = customRender(ActionGroup, {
      actions: [secondaryAction],
      isOnDark: true,
    });
    darkSetup();

    expect(
      screen.getByRole('link', {
        name: 'Learn more about our subscription plans',
      }).className,
    ).toContain('text-white');
  });

  it('leaves a primary action styling untouched on a dark background', () => {
    const darkSetup = customRender(ActionGroup, {
      actions: [primaryAction],
      isOnDark: true,
    });
    darkSetup();

    expect(
      screen.getByRole('link', { name: 'Subscribe now' }).className,
    ).not.toContain('text-white');
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
      ariaLabel: undefined,
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
