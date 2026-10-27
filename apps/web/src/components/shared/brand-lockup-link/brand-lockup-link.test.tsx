import { routes } from '@blog/config';
import { faker } from '@faker-js/faker';
import { customRender, screen, waitFor } from '@web/testing/custom-render';

import { BrandLockupLink } from './brand-lockup-link';

faker.seed(5301);

const MOCK_LOGO_URL = faker.image.url();
const MOCK_TAGLINE = faker.lorem.words(3);
const HOME_LINK_NAME = 'Home';

const setup = customRender(BrandLockupLink, { logoUrl: MOCK_LOGO_URL });

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

  it('falls through to the polygon mark when no logo is uploaded', () => {
    setup({ logoUrl: undefined });

    const logo = screen.queryByRole('presentation');
    const link = screen.getByRole('link', { name: HOME_LINK_NAME });

    expect(logo).not.toBeInTheDocument();
    expect(link).not.toBeEmptyDOMElement();
  });

  it('falls back to the polygon mark when the logo fails to load', async () => {
    vi.spyOn(HTMLImageElement.prototype, 'decode').mockRejectedValue(
      new Error(faker.lorem.sentence()),
    );

    setup();

    await waitFor(() => {
      const logo = screen.queryByRole('presentation');
      expect(logo).not.toBeInTheDocument();
    });
    const link = screen.getByRole('link', { name: HOME_LINK_NAME });
    expect(link).not.toBeEmptyDOMElement();
  });

  it('shows the tagline when set', () => {
    setup({ tagline: MOCK_TAGLINE });

    const tagline = screen.getByText(MOCK_TAGLINE);

    expect(tagline).toBeVisible();
  });
});
