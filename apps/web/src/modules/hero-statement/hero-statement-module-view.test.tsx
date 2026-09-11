import {
  BRAND_VARIANT,
  CTA_ACTION_APPEARANCE,
  CTA_ACTION_VARIANT,
  HERO_VARIANT,
} from '@blog/config';
import { customRender, screen } from '@web/testing/custom-render';
import { makeSanityImage } from '@web/testing/modules/hero/fixtures';

import { HeroStatementModuleView } from './hero-statement-module-view';

const sanityImage = makeSanityImage();

const primaryAction = {
  variant: CTA_ACTION_VARIANT.PRIMARY,
  appearance: CTA_ACTION_APPEARANCE.CONTAINED,
  link: {
    label: 'Get started',
    href: '/get-started',
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
    ariaLabel: undefined,
  },
};

const setup = customRender(HeroStatementModuleView, {
  id: 'hero-statement-1',
  brandVariant: BRAND_VARIANT.PRIMARY,
  variant: HERO_VARIANT.SPLIT,
  eyebrow: undefined,
  heading: 'Build faster, ship sooner',
  supportingText: undefined,
  sanityImage: undefined,
  actions: undefined,
  contentPosition: undefined,
  contentAlignment: undefined,
  mediaOrder: undefined,
  layout: undefined,
});

describe(`<${HeroStatementModuleView.name}/>`, () => {
  it('renders the heading as the top-level heading, labelling the Section via a unique id derived from the module id', () => {
    setup();

    const heading = screen.getByRole('heading', {
      level: 1,
      name: 'Build faster, ship sooner',
    });
    expect(heading).toBeVisible();
    expect(heading).toHaveAttribute('id', 'hero-statement-hero-statement-1');

    const section = heading.closest('section');
    expect(section).toHaveAttribute(
      'aria-labelledby',
      'hero-statement-hero-statement-1',
    );
  });

  it('renders the hero image cropped to a 16:9 (675) height', () => {
    setup({ sanityImage });

    const img = screen.getByRole('img', { name: sanityImage.alt });

    expect(img).toHaveAttribute('height', '675');
    expect(img.getAttribute('src')).toContain('h=675');
  });

  it('renders no Hero.Cta slot when no actions are authored', () => {
    setup({ actions: undefined });

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('renders a single authored action', () => {
    setup({ actions: [primaryAction] });

    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveTextContent('Get started');
  });

  it('renders every authored action, in order', () => {
    setup({ actions: [primaryAction, secondaryAction] });

    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveTextContent('Get started');
    expect(links[1]).toHaveTextContent('Learn more');
  });

  it('reverses the non-primary action for legibility on a Banner over an image', () => {
    setup({ variant: HERO_VARIANT.BANNER, actions: [secondaryAction] });

    const link = screen.getByRole('link', { name: 'Learn more' });
    expect(link.className).toContain('border-white/55');
  });

  it('does not reverse the non-primary action on Split or Stacked', () => {
    setup({ variant: HERO_VARIANT.SPLIT, actions: [secondaryAction] });

    const link = screen.getByRole('link', { name: 'Learn more' });
    expect(link.className).not.toContain('border-white/55');
  });
});
