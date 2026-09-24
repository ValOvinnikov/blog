import { BRAND_VARIANT, DISPLAY_MODE } from '@blog/config';
import { customRender, screen } from '@web/testing/custom-render';
import { ctaActionsDemo } from '@web/testing/modules/cta/fixtures';
import { makeLogoItem } from '@web/testing/modules/logo-wall/fixtures';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { SmartLinkMock } from '@web/testing/shared/smart-link/smart-link-mock';

import { LogoWallModuleView } from './logo-wall-module-view';

vi.mock('@web/components/shared/smart-link', () => ({
  SmartLink: SmartLinkMock,
}));

const { LogoWallCarousel } = vi.hoisted(() => ({
  LogoWallCarousel: vi.fn(() => <div data-testid="logo-wall-carousel-stub" />),
}));

vi.mock('./components/logo-wall-carousel/logo-wall-carousel', () => ({
  LogoWallCarousel,
}));

const logos = [
  makeLogoItem({ id: 'logo-1', name: 'Acme Corp' }),
  makeLogoItem({ id: 'logo-2', name: 'Nimbus Inc' }),
];

const dataTestId = 'logo-wall-module-logo-wall-1';

const setup = customRender(LogoWallModuleView, {
  brandVariant: BRAND_VARIANT.PRIMARY,
  headingBlock: makeHeadingBlock({ heading: 'Trusted by' }),
  logos,
  ctaButtons: [],
  displayMode: DISPLAY_MODE.GRID,
  contentAlignment: undefined,
  layout: undefined,
  titleId: 'logo-wall-title',
  dataTestId,
});

describe(`<${LogoWallModuleView.name}/>`, () => {
  describe('two logos in a wrapping row with no actions', () => {
    beforeEach(() => {
      setup();
    });

    it('labels the section with the given titleId', () => {
      const label = screen.getByText('Trusted by');
      expect(label).toHaveAttribute('id', 'logo-wall-title');
      expect(label.tagName).toBe('H2');

      const section = label.closest('section');
      expect(section).toHaveAttribute('aria-labelledby', 'logo-wall-title');
      expect(section).toHaveAttribute('data-testid', dataTestId);
    });

    it('renders every logo as an image named after the company, never as visible text', () => {
      logos.forEach((logo) => {
        expect(
          screen.getByRole('img', { name: logo.name }),
        ).toBeInTheDocument();
      });
      expect(LogoWallCarousel).not.toHaveBeenCalled();
    });

    it('renders no action group when there are no cta buttons', () => {
      expect(screen.queryAllByRole('link')).toHaveLength(0);
    });
  });

  it('wraps a logo in a link when it has one, and leaves an unlinked logo bare', () => {
    setup({
      logos: [
        makeLogoItem({
          id: 'logo-1',
          name: 'Acme Corp',
          link: {
            label: 'Visit Acme Corp',
            href: 'https://acme.example.com',
            target: undefined,
            platform: undefined,
            ariaLabel: undefined,
          },
        }),
        makeLogoItem({ id: 'logo-2', name: 'Nimbus Inc' }),
      ],
    });

    expect(screen.getByRole('link', { name: 'Acme Corp' })).toHaveAttribute(
      'href',
      'https://acme.example.com',
    );
    expect(screen.getAllByRole('link')).toHaveLength(1);
  });

  it('renders the carousel instead of the row when displayMode is CAROUSEL', () => {
    setup({ displayMode: DISPLAY_MODE.CAROUSEL });

    expect(LogoWallCarousel).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('logo-wall-carousel-stub')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('renders nothing when logos is empty, never an empty landmark with a dangling aria-labelledby', () => {
    const { container } = setup({ logos: [] });

    expect(container).toBeEmptyDOMElement();
  });

  it('renders the resolved cta buttons when present', () => {
    setup({ ctaButtons: ctaActionsDemo });

    expect(screen.getByRole('link', { name: 'Subscribe now' })).toHaveAttribute(
      'href',
      '/blog',
    );
    expect(
      screen.getByRole('link', {
        name: 'Learn more about our subscription plans',
      }),
    ).toHaveAttribute('href', '/about-us');
  });
});
