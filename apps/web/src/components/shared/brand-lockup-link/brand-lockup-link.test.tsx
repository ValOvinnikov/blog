import { routes } from '@blog/config';
import { toInitial } from '@blog/utils/primitives';
import { faker } from '@faker-js/faker';
import { customRender, screen, waitFor } from '@web/testing/custom-render';

import { BrandLockupLink } from './brand-lockup-link';

faker.seed(5301);

const MOCK_LOGO_URL = faker.image.url();
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

  it('shows the tagline when set', () => {
    setup({ tagline: MOCK_TAGLINE });

    const tagline = screen.getByText(MOCK_TAGLINE);

    expect(tagline).toBeVisible();
  });
});
