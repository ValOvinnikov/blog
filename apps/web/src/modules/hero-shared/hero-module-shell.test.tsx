import { BRAND_VARIANT, CTA_ACTION_VARIANT, HERO_VARIANT } from '@blog/config';
import { customRender, screen } from '@web/testing/custom-render';

import { HeroModuleShell } from './hero-module-shell';

const ctaButton = {
  variant: CTA_ACTION_VARIANT.PRIMARY,
  appearance: undefined,
  link: {
    label: 'Learn more',
    href: '/learn-more',
    target: undefined,
    platform: undefined,
    ariaLabel: undefined,
  },
};

const setup = customRender(HeroModuleShell, {
  brandVariant: BRAND_VARIANT.PRIMARY,
  variant: HERO_VARIANT.SPLIT,
  eyebrow: undefined,
  title: 'Shared hero shell',
  titleId: 'shared-hero-shell',
  excerpt: undefined,
  contentPosition: undefined,
  contentAlignment: undefined,
  mediaOrder: undefined,
  layout: undefined,
  dataTestId: 'hero-shell',
  ctaButtons: [],
  children: <p>Slot content</p>,
});

describe(`<${HeroModuleShell.name}/>`, () => {
  it('renders the title as the top-level heading, labelling the Section via titleId', () => {
    setup();

    const heading = screen.getByRole('heading', {
      level: 1,
      name: 'Shared hero shell',
    });
    expect(heading).toBeVisible();
    expect(heading).toHaveAttribute('id', 'shared-hero-shell');

    const section = heading.closest('section');
    expect(section).toHaveAttribute('aria-labelledby', 'shared-hero-shell');
  });

  it('renders its children inside the Hero', () => {
    setup();

    expect(screen.getByText('Slot content')).toBeVisible();
  });

  it('renders no Hero.Cta slot when ctaButtons is empty', () => {
    setup();

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('renders a link for each authored ctaButton', () => {
    setup({ ctaButtons: [ctaButton] });

    expect(screen.getByRole('link', { name: 'Learn more' })).toBeVisible();
  });
});
