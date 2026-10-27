import { TextLink } from '@blog/ui/components/atoms/text-link';
import { renderElement, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';

import { Footer } from './footer';

faker.seed(123);

const MOCK_SITE_TITLE = faker.company.name();
const MOCK_YEAR = faker.date.past().getFullYear();
const MOCK_NAV_LABEL = faker.lorem.words(2);
const MOCK_STRAY_TEXT = faker.lorem.sentence();
const MOCK_LINK = {
  label: faker.lorem.word(),
  href: `/${faker.lorem.slug(1)}`,
};
const MOCK_OTHER_LINK = {
  label: faker.lorem.words(2),
  href: `/${faker.lorem.slug(2)}`,
};

describe(`<${Footer.name}/>`, () => {
  describe('with only Footer.Copyright', () => {
    beforeEach(() => {
      renderElement(
        <Footer>
          <Footer.Copyright title={MOCK_SITE_TITLE} year={MOCK_YEAR} />
        </Footer>,
      );
    });

    it('renders Footer.Copyright with the given year and title', () => {
      const copyright = screen.getByText(`© ${MOCK_YEAR} ${MOCK_SITE_TITLE}`);

      expect(copyright).toBeVisible();
    });

    it('renders no navigation when Footer.Nav is omitted', () => {
      const nav = screen.queryByRole('navigation');

      expect(nav).not.toBeInTheDocument();
    });
  });

  it('renders Footer.Nav as a labelled navigation of working links', () => {
    renderElement(
      <Footer>
        <Footer.Nav ariaLabel={MOCK_NAV_LABEL}>
          <TextLink appearance="nav" href={MOCK_LINK.href}>
            {MOCK_LINK.label}
          </TextLink>
          <TextLink appearance="nav" href={MOCK_OTHER_LINK.href}>
            {MOCK_OTHER_LINK.label}
          </TextLink>
        </Footer.Nav>
      </Footer>,
    );

    const nav = screen.getByRole('navigation', { name: MOCK_NAV_LABEL });
    const link = screen.getByRole('link', { name: MOCK_LINK.label });
    const otherLink = screen.getByRole('link', {
      name: MOCK_OTHER_LINK.label,
    });

    expect(nav).toBeVisible();
    expect(link).toHaveAttribute('href', MOCK_LINK.href);
    expect(otherLink).toHaveAttribute('href', MOCK_OTHER_LINK.href);
  });

  it('renders unmatched children without dropping them', () => {
    renderElement(
      <Footer>
        <Footer.Copyright title={MOCK_SITE_TITLE} year={MOCK_YEAR} />
        <span>{MOCK_STRAY_TEXT}</span>
      </Footer>,
    );

    const strayContent = screen.getByText(MOCK_STRAY_TEXT);

    expect(strayContent).toBeVisible();
  });

  it('renders as a <footer> landmark', () => {
    renderElement(<Footer />);

    const footer = screen.getByRole('contentinfo');

    expect(footer).toBeVisible();
  });
});
