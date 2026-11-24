import { faker } from '@faker-js/faker';
import { BRAND_VARIANT, HEADER_BAR_STYLE } from '@shinefold/config';
import { TextLink } from '@shinefold/ui/components/atoms/text-link';
import { HEADER_TEST_ID } from '@shinefold/ui/constants/header';
import { renderElement, screen } from '@shinefold/ui/testing/custom-render';

import { Header } from './header';

faker.seed(6013);

const MOCK_BRAND = faker.company.name();
const MOCK_HOME_LABEL = faker.lorem.word();
const MOCK_BLOG_LABEL = faker.lorem.word();
const MOCK_BLOG_HREF = `/${faker.lorem.slug()}`;
const MOCK_ACTION_LABEL = faker.lorem.word();
const MOCK_STRAY_TEXT = faker.lorem.sentence();

describe(`<${Header.name}/>`, () => {
  it('renders the brand slot', () => {
    renderElement(
      <Header>
        <Header.Brand>{MOCK_BRAND}</Header.Brand>
      </Header>,
    );

    const brand = screen.getByText(MOCK_BRAND);

    expect(brand).toBeVisible();
  });

  it('renders the nav slot with each link href', () => {
    renderElement(
      <Header>
        <Header.Nav>
          <TextLink appearance="nav" href="/">
            {MOCK_HOME_LABEL}
          </TextLink>
          <TextLink appearance="nav" href={MOCK_BLOG_HREF}>
            {MOCK_BLOG_LABEL}
          </TextLink>
        </Header.Nav>
      </Header>,
    );

    const homeLink = screen.getByRole('link', { name: MOCK_HOME_LABEL });
    const blogLink = screen.getByRole('link', { name: MOCK_BLOG_LABEL });

    expect(homeLink).toBeVisible();
    expect(blogLink).toHaveAttribute('href', MOCK_BLOG_HREF);
  });

  it('renders the actions slot', () => {
    renderElement(
      <Header>
        <Header.Actions>
          <button>{MOCK_ACTION_LABEL}</button>
        </Header.Actions>
      </Header>,
    );

    const actionButton = screen.getByRole('button', {
      name: MOCK_ACTION_LABEL,
    });

    expect(actionButton).toBeVisible();
  });

  it('renders unmatched children without dropping them', () => {
    renderElement(
      <Header>
        <Header.Brand>{MOCK_BRAND}</Header.Brand>
        <span>{MOCK_STRAY_TEXT}</span>
      </Header>,
    );

    const strayContent = screen.getByText(MOCK_STRAY_TEXT);

    expect(strayContent).toBeVisible();
  });

  it('puts the tone on the full-width bar', () => {
    renderElement(<Header tone={BRAND_VARIANT.INK} />);

    const banner = screen.getByRole('banner');

    expect(banner).toHaveAttribute('data-skin', BRAND_VARIANT.INK);
  });

  it('moves the tone from the strip onto the card when the bar floats', () => {
    renderElement(
      <Header tone={BRAND_VARIANT.INK} barStyle={HEADER_BAR_STYLE.FLOATING} />,
    );

    const banner = screen.getByRole('banner');
    const card = screen.getByTestId(HEADER_TEST_ID.CARD);

    expect(banner).not.toHaveAttribute('data-skin');
    expect(card).toHaveAttribute('data-skin', BRAND_VARIANT.INK);
  });

  it('renders as a banner landmark', () => {
    renderElement(<Header />);

    const banner = screen.getByRole('banner');

    expect(banner).toBeVisible();
  });
});
