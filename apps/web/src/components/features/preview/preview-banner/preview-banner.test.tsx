import { LOCALE_BCP47_TAGS, LOCALE_ISO_CODES, routes } from '@blog/config';
import { usePathname } from '@web/i18n/navigation';
import { customRender, screen } from '@web/testing/custom-render';

import { PreviewBanner } from './preview-banner';

vi.mock('@web/i18n/navigation');

const { EN, NL } = LOCALE_ISO_CODES;
const BLOG_PATH = routes.blogIndex();

const setup = customRender(PreviewBanner, { locale: EN, defaultLocale: EN });

describe(`<${PreviewBanner.name}/>`, () => {
  beforeEach(() => {
    vi.mocked(usePathname).mockReturnValue(BLOG_PATH);
  });

  it('links the exit back to the page being previewed', () => {
    setup();
    const exitLink = screen.getByRole('link');

    expect(exitLink).toHaveAttribute('href', routes.previewExit(BLOG_PATH));
  });

  it("keeps a non-default language's prefix in the exit link", () => {
    setup({ locale: NL });
    const exitLink = screen.getByRole('link');

    expect(exitLink).toHaveAttribute(
      'href',
      routes.previewExit(`/${LOCALE_BCP47_TAGS[NL]}${BLOG_PATH}`),
    );
  });
});
