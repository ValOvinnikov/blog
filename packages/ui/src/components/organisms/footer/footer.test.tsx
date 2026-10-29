import { FOOTER_LAYOUT, type TFooterLayout } from '@blog/config';
import { TextLink } from '@blog/ui/components/atoms/text-link';
import { renderElement, screen, within } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';

import { Footer } from './footer';

faker.seed(123);

const MOCK_SITE_TITLE = faker.company.name();
const MOCK_YEAR = faker.date.past().getFullYear();
const MOCK_NAV_LABEL = faker.lorem.words(2);
const MOCK_GROUPS_LABEL = faker.lorem.words(2);
const MOCK_FINE_PRINT_LABEL = faker.lorem.words(3);
const MOCK_GROUP_HEADING = faker.lorem.word();
const MOCK_ABOUT = faker.lorem.sentence();
const MOCK_GROUP_TEXT = faker.lorem.sentence();
const MOCK_ADDRESS = faker.location.streetAddress();
const MOCK_STRAY_TEXT = faker.lorem.sentence();
const MOCK_LINK = {
  label: faker.lorem.word(),
  href: `/${faker.lorem.slug(1)}`,
};
const MOCK_PRIVACY_LINK = {
  label: faker.lorem.words(2),
  href: `/${faker.lorem.slug(2)}`,
};

const ALL_LAYOUTS = Object.values(FOOTER_LAYOUT);
const FULL_LAYOUTS = ALL_LAYOUTS.filter(
  (layout) => layout !== FOOTER_LAYOUT.COMPACT,
);

const renderFullFooter = (layout: TFooterLayout) =>
  renderElement(
    <Footer layout={layout}>
      <Footer.About>{MOCK_ABOUT}</Footer.About>
      <Footer.Address>{MOCK_ADDRESS}</Footer.Address>
      <Footer.Groups ariaLabel={MOCK_GROUPS_LABEL}>
        <Footer.Group heading={MOCK_GROUP_HEADING} headingLevel={2}>
          <Footer.GroupItem>
            <TextLink appearance="nav" href={MOCK_LINK.href}>
              {MOCK_LINK.label}
            </TextLink>
          </Footer.GroupItem>
          <Footer.GroupItem>{MOCK_GROUP_TEXT}</Footer.GroupItem>
        </Footer.Group>
      </Footer.Groups>
      <Footer.Wordmark>{MOCK_SITE_TITLE}</Footer.Wordmark>
      <Footer.Copyright title={MOCK_SITE_TITLE} year={MOCK_YEAR} />
      <Footer.FinePrint ariaLabel={MOCK_FINE_PRINT_LABEL}>
        <TextLink appearance="nav" href={MOCK_PRIVACY_LINK.href}>
          {MOCK_PRIVACY_LINK.label}
        </TextLink>
      </Footer.FinePrint>
    </Footer>,
  );

describe(`<${Footer.name}/>`, () => {
  it.each(FULL_LAYOUTS)(
    'renders the about text, address and link groups in the %s layout',
    (layout) => {
      renderFullFooter(layout);

      const about = screen.getByText(MOCK_ABOUT);
      const address = screen.getByText(MOCK_ADDRESS);
      const groups = screen.getByRole('navigation', {
        name: MOCK_GROUPS_LABEL,
      });
      const groupLink = within(groups).getByRole('link', {
        name: MOCK_LINK.label,
      });

      expect(about).toBeVisible();
      expect(address).toBeVisible();
      expect(groupLink).toHaveAttribute('href', MOCK_LINK.href);
    },
  );

  it('never renders groups, about text or address in the Compact layout', () => {
    renderFullFooter(FOOTER_LAYOUT.COMPACT);

    const about = screen.queryByText(MOCK_ABOUT);
    const address = screen.queryByText(MOCK_ADDRESS);
    const groups = screen.queryByRole('navigation', {
      name: MOCK_GROUPS_LABEL,
    });
    const finePrint = screen.getByRole('navigation', {
      name: MOCK_FINE_PRINT_LABEL,
    });

    expect(about).not.toBeInTheDocument();
    expect(address).not.toBeInTheDocument();
    expect(groups).not.toBeInTheDocument();
    expect(finePrint).toBeVisible();
  });

  it.each(ALL_LAYOUTS)(
    'renders only the copyright line when nothing else is given in the %s layout',
    (layout) => {
      renderElement(
        <Footer layout={layout}>
          <Footer.Copyright title={MOCK_SITE_TITLE} year={MOCK_YEAR} />
        </Footer>,
      );

      const copyright = screen.getByText(`© ${MOCK_YEAR} ${MOCK_SITE_TITLE}`);
      const navigation = screen.queryByRole('navigation');

      expect(copyright).toBeVisible();
      expect(navigation).not.toBeInTheDocument();
    },
  );

  it('names the link groups and the fine print as two distinct navigation landmarks', () => {
    renderFullFooter(FOOTER_LAYOUT.COLUMNS);

    const groups = screen.getByRole('navigation', { name: MOCK_GROUPS_LABEL });
    const finePrint = screen.getByRole('navigation', {
      name: MOCK_FINE_PRINT_LABEL,
    });
    const groupLink = within(groups).getByRole('link', {
      name: MOCK_LINK.label,
    });
    const privacyLink = within(finePrint).getByRole('link', {
      name: MOCK_PRIVACY_LINK.label,
    });

    expect(groupLink).toHaveAttribute('href', MOCK_LINK.href);
    expect(privacyLink).toHaveAttribute('href', MOCK_PRIVACY_LINK.href);
  });

  it('heads each link group with the heading level it is given', () => {
    renderFullFooter(FOOTER_LAYOUT.COLUMNS);

    const heading = screen.getByRole('heading', {
      level: 2,
      name: MOCK_GROUP_HEADING,
    });

    expect(heading).toBeInTheDocument();
  });

  it('shows the site name as a wordmark hidden from assistive technology in the Big wordmark layout', () => {
    renderFullFooter(FOOTER_LAYOUT.BIG_WORDMARK);

    const wordmark = screen.getByText(MOCK_SITE_TITLE);

    expect(wordmark).toHaveAttribute('aria-hidden', 'true');
  });

  it.each(
    ALL_LAYOUTS.filter((layout) => layout !== FOOTER_LAYOUT.BIG_WORDMARK),
  )('renders no wordmark in the %s layout', (layout) => {
    renderFullFooter(layout);

    const wordmark = screen.queryByText(MOCK_SITE_TITLE);

    expect(wordmark).not.toBeInTheDocument();
  });

  it('lists plain text in a link group as an item beside the links', () => {
    renderFullFooter(FOOTER_LAYOUT.COLUMNS);

    const groups = screen.getByRole('navigation', { name: MOCK_GROUPS_LABEL });
    const items = within(groups).getAllByRole('listitem');
    const textItem = within(groups).getByText(MOCK_GROUP_TEXT);

    expect(items).toHaveLength(2);
    expect(textItem).toBeVisible();
  });

  it('divides the brand column from the fine-print row', () => {
    renderElement(
      <Footer>
        <Footer.About>{MOCK_ABOUT}</Footer.About>
        <Footer.Copyright title={MOCK_SITE_TITLE} year={MOCK_YEAR} />
      </Footer>,
    );

    const divider = screen.getByRole('separator');

    expect(divider).toBeInTheDocument();
  });

  it.each([
    ['logo', <Footer.Logo key="logo" />],
    ['about text', <Footer.About key="about" />],
    ['address', <Footer.Address key="address" />],
    ['social links', <Footer.Social key="social" />],
  ])('draws no brand column or divider for empty %s', (_, emptySlot) => {
    renderElement(
      <Footer>
        {emptySlot}
        <Footer.Copyright title={MOCK_SITE_TITLE} year={MOCK_YEAR} />
      </Footer>,
    );

    const divider = screen.queryByRole('separator');

    expect(divider).not.toBeInTheDocument();
  });

  it('draws no navigation or divider for link groups that have no items', () => {
    renderElement(
      <Footer>
        <Footer.Groups ariaLabel={MOCK_GROUPS_LABEL}>
          <Footer.Group heading={MOCK_GROUP_HEADING} headingLevel={2}>
            <Footer.GroupItem />
          </Footer.Group>
          <Footer.Group heading={MOCK_GROUP_HEADING} headingLevel={2} />
        </Footer.Groups>
        <Footer.Copyright title={MOCK_SITE_TITLE} year={MOCK_YEAR} />
      </Footer>,
    );

    const groups = screen.queryByRole('navigation', {
      name: MOCK_GROUPS_LABEL,
    });
    const heading = screen.queryByRole('heading', { name: MOCK_GROUP_HEADING });
    const divider = screen.queryByRole('separator');

    expect(groups).not.toBeInTheDocument();
    expect(heading).not.toBeInTheDocument();
    expect(divider).not.toBeInTheDocument();
  });

  it('draws no divider for an empty wordmark in the Big wordmark layout', () => {
    renderElement(
      <Footer layout={FOOTER_LAYOUT.BIG_WORDMARK}>
        <Footer.Wordmark />
        <Footer.Copyright title={MOCK_SITE_TITLE} year={MOCK_YEAR} />
      </Footer>,
    );

    const divider = screen.queryByRole('separator');

    expect(divider).not.toBeInTheDocument();
  });

  it('renders Footer.Nav as a labelled navigation', () => {
    renderElement(
      <Footer>
        <Footer.Nav ariaLabel={MOCK_NAV_LABEL}>
          <TextLink appearance="nav" href={MOCK_LINK.href}>
            {MOCK_LINK.label}
          </TextLink>
        </Footer.Nav>
      </Footer>,
    );

    const nav = screen.getByRole('navigation', { name: MOCK_NAV_LABEL });
    const link = within(nav).getByRole('link', { name: MOCK_LINK.label });

    expect(link).toHaveAttribute('href', MOCK_LINK.href);
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
