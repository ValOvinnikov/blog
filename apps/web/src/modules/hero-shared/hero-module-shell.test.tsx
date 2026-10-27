import { BRAND_VARIANT, HERO_VARIANT } from '@blog/config';
import { faker } from '@faker-js/faker';
import { customRender, screen } from '@web/testing/custom-render';
import {
  MOCK_CTA_PRIMARY_ACTION,
  MOCK_CTA_SECONDARY_ACTION,
} from '@web/testing/modules/cta/fixtures';
import { mockSanityImage } from '@web/testing/modules/hero/fixtures';

import { HeroModuleShell } from './hero-module-shell';

faker.seed(6011);

const MOCK_SANITY_IMAGE = mockSanityImage();
const MOCK_TITLE = faker.company.catchPhrase();
const MOCK_TITLE_ID = faker.lorem.slug();
const MOCK_SLOT_CONTENT = faker.lorem.sentence();

const setup = customRender(HeroModuleShell, {
  brandVariant: BRAND_VARIANT.PRIMARY,
  variant: HERO_VARIANT.SPLIT,
  eyebrow: undefined,
  title: MOCK_TITLE,
  titleId: MOCK_TITLE_ID,
  excerpt: undefined,
  contentPosition: undefined,
  contentAlignment: undefined,
  mediaOrder: undefined,
  layout: undefined,
  ctaButtons: [],
  sanityImage: undefined,
  children: <p>{MOCK_SLOT_CONTENT}</p>,
});

describe(`<${HeroModuleShell.name}/>`, () => {
  describe('with the default props', () => {
    beforeEach(() => {
      setup();
    });

    it('renders the title as the top-level heading that labels the section', () => {
      const heading = screen.getByRole('heading', {
        level: 1,
        name: MOCK_TITLE,
      });
      const section = screen.getByRole('region', { name: MOCK_TITLE });

      expect(heading).toBeVisible();
      expect(heading).toHaveAttribute('id', MOCK_TITLE_ID);
      expect(section).toHaveAttribute('aria-labelledby', MOCK_TITLE_ID);
    });

    it('renders its children', () => {
      const slotContent = screen.getByText(MOCK_SLOT_CONTENT);

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
    const [firstLink, secondLink] = links;

    expect(links).toHaveLength(2);
    expect(firstLink).toHaveTextContent(MOCK_CTA_PRIMARY_ACTION.link.label);
    expect(secondLink).toHaveTextContent(MOCK_CTA_SECONDARY_ACTION.link.label);
  });

  it('renders the hero image cropped to a 16:9 (675) height, eagerly', () => {
    setup({ sanityImage: MOCK_SANITY_IMAGE });

    const image = screen.getByRole('img', { name: MOCK_SANITY_IMAGE.alt });
    const imageSource = image.getAttribute('src');

    expect(image).toHaveAttribute('height', '675');
    expect(imageSource).toContain('h=675');
    expect(image).toHaveAttribute('fetchpriority', 'high');
  });

  it('renders the hero image as a decorative backdrop on Banner', () => {
    setup({ variant: HERO_VARIANT.BANNER, sanityImage: MOCK_SANITY_IMAGE });

    const namedImage = screen.queryByRole('img');
    const backdrop = screen.getByRole('presentation');

    expect(namedImage).not.toBeInTheDocument();
    expect(backdrop).toHaveAttribute('alt', '');
  });
});
