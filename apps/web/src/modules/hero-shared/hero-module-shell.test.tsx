import { BRAND_VARIANT, HERO_VARIANT } from '@blog/config';
import { customRender, screen } from '@web/testing/custom-render';
import {
  MOCK_CTA_PRIMARY_ACTION,
  MOCK_CTA_SECONDARY_ACTION,
} from '@web/testing/modules/cta/fixtures';
import { mockSanityImage } from '@web/testing/modules/hero/fixtures';

import { HeroModuleShell } from './hero-module-shell';

const sanityImage = mockSanityImage();

const TITLE = 'Shared hero shell';
const TITLE_ID = 'shared-hero-shell';

const setup = customRender(HeroModuleShell, {
  brandVariant: BRAND_VARIANT.PRIMARY,
  variant: HERO_VARIANT.SPLIT,
  eyebrow: undefined,
  title: TITLE,
  titleId: TITLE_ID,
  excerpt: undefined,
  contentPosition: undefined,
  contentAlignment: undefined,
  mediaOrder: undefined,
  layout: undefined,
  dataTestId: 'hero-shell',
  ctaButtons: [],
  sanityImage: undefined,
  children: <p>Slot content</p>,
});

describe(`<${HeroModuleShell.name}/>`, () => {
  describe('with the default props', () => {
    beforeEach(() => {
      setup();
    });

    it('renders the title as the top-level heading that labels the section', () => {
      const heading = screen.getByRole('heading', {
        level: 1,
        name: TITLE,
      });
      const section = screen.getByRole('region', { name: TITLE });
      expect(heading).toBeVisible();
      expect(heading).toHaveAttribute('id', TITLE_ID);
      expect(section).toHaveAttribute('aria-labelledby', TITLE_ID);
    });

    it('renders its children', () => {
      const slotContent = screen.getByText('Slot content');
      expect(slotContent).toBeVisible();
    });

    it('renders no actions when none are authored', () => {
      const link = screen.queryByRole('link');
      expect(link).not.toBeInTheDocument();
    });

    it('renders no media without an image', () => {
      const image = screen.queryByRole('img');
      expect(image).not.toBeInTheDocument();
    });
  });

  it('renders a link for an authored action', () => {
    setup({ ctaButtons: [MOCK_CTA_PRIMARY_ACTION] });

    const link = screen.getByRole('link', {
      name: MOCK_CTA_PRIMARY_ACTION.link.label,
    });
    expect(link).toBeVisible();
    expect(link).toHaveAttribute('href', MOCK_CTA_PRIMARY_ACTION.link.href);
  });

  it('renders every authored action in order', () => {
    setup({ ctaButtons: [MOCK_CTA_PRIMARY_ACTION, MOCK_CTA_SECONDARY_ACTION] });

    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveTextContent(MOCK_CTA_PRIMARY_ACTION.link.label);
    expect(links[1]).toHaveTextContent(MOCK_CTA_SECONDARY_ACTION.link.label);
  });

  it('renders the hero image cropped to a 16:9 (675) height, eagerly', () => {
    setup({ sanityImage });

    const img = screen.getByRole('img', { name: sanityImage.alt });
    expect(img).toHaveAttribute('height', '675');
    expect(img.getAttribute('src')).toContain('h=675');
    expect(img).toHaveAttribute('fetchpriority', 'high');
  });

  it('renders the hero image as a decorative backdrop on Banner', () => {
    setup({ variant: HERO_VARIANT.BANNER, sanityImage });

    const namedImage = screen.queryByRole('img');
    const backdrop = screen.getByRole('presentation');
    expect(namedImage).not.toBeInTheDocument();
    expect(backdrop).toHaveAttribute('alt', '');
  });
});
