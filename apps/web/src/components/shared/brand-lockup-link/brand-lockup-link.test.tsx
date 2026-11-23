import { faker } from '@faker-js/faker';
import { routes } from '@shinefold/config';
import { toInitial } from '@shinefold/utils/primitives';
import { customRender, screen, waitFor } from '@web/testing/custom-render';

import { BrandLockupLink } from './brand-lockup-link';

faker.seed(5301);

const [MOCK_LOGO_URL, MOCK_DARK_LOGO_URL] = faker.helpers.uniqueArray(
  faker.image.url,
  2,
);
const MOCK_TAGLINE = faker.lorem.words(3);
const MOCK_SITE_NAME = faker.company.name();
const MOCK_SITE_INITIAL = toInitial(MOCK_SITE_NAME)!;
const HOME_LINK_NAME = 'Home';

const setup = customRender(BrandLockupLink, {
  logoUrl: MOCK_LOGO_URL,
  siteName: MOCK_SITE_NAME,
});

describe(`<${BrandLockupLink.name}/>`, () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders a link home labelled "Home" wrapping the logo', () => {
    setup();

    const link = screen.getByRole('link', { name: HOME_LINK_NAME });
    const logo = screen.getByRole('presentation');

    expect(link).toHaveAttribute('href', routes.home());
    expect(logo).toHaveAttribute('src', MOCK_LOGO_URL);
  });

  it("shows the site's initial tile when no logo is uploaded", () => {
    setup({ logoUrl: undefined });

    const logo = screen.queryByRole('presentation');
    const initial = screen.getByText(MOCK_SITE_INITIAL);

    expect(logo).not.toBeInTheDocument();
    expect(initial).toBeInTheDocument();
  });

  it("falls back to the site's initial tile when the logo fails to load", async () => {
    vi.spyOn(HTMLImageElement.prototype, 'decode').mockRejectedValue(
      new Error(faker.lorem.sentence()),
    );

    setup();

    await waitFor(() => {
      const logo = screen.queryByRole('presentation');
      expect(logo).not.toBeInTheDocument();
    });
    const initial = screen.getByText(MOCK_SITE_INITIAL);
    expect(initial).toBeInTheDocument();
  });

  it('shows the dark-mode logo alongside the main logo', () => {
    setup({ darkLogoUrl: MOCK_DARK_LOGO_URL });

    const logos = screen.getAllByRole('presentation');

    expect(logos.map((logo) => logo.getAttribute('src'))).toEqual([
      MOCK_LOGO_URL,
      MOCK_DARK_LOGO_URL,
    ]);
  });

  it('keeps the main logo for dark mode when the dark-mode logo fails to load', async () => {
    vi.spyOn(HTMLImageElement.prototype, 'decode').mockImplementation(function (
      this: HTMLImageElement,
    ) {
      return this.getAttribute('src') === MOCK_DARK_LOGO_URL
        ? Promise.reject(new Error(faker.lorem.sentence()))
        : Promise.resolve();
    });

    setup({ darkLogoUrl: MOCK_DARK_LOGO_URL });

    await waitFor(() => {
      const logos = screen.getAllByRole('presentation');
      expect(logos).toHaveLength(1);
    });
    const logo = screen.getByRole('presentation');
    expect(logo).toHaveAttribute('src', MOCK_LOGO_URL);
  });

  it('shows the tagline when set', () => {
    setup({ tagline: MOCK_TAGLINE });

    const tagline = screen.getByText(MOCK_TAGLINE);

    expect(tagline).toBeVisible();
  });
});
