import { LOCALE_ISO_CODES } from '@blog/config';
import { ARIA_CURRENT } from '@blog/ui/testing/aria';
import { customRender, screen } from '@blog/ui/testing/custom-render';
import { MOCK_LINK_TEST_ID, MockLink } from '@blog/ui/testing/mock-link';
import { faker } from '@faker-js/faker';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { TextLink, type TTextLinkProps } from './text-link';

faker.seed(123);

const MOCK_LABEL = faker.lorem.words(3);
const MOCK_HREF = `/${faker.lorem.slug()}`;
const MOCK_ARIA_LABEL = faker.lorem.words(2);
const TEXT_LINK_TEST_ID = 'text-link';
const ARIA_CURRENT_PAGE = 'page';

const setup = customRender(TextLink, { href: MOCK_HREF, children: MOCK_LABEL });

describe(`<${TextLink.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  it('renders a link to href named by its children', () => {
    setup();

    const link = screen.getByRole('link', { name: MOCK_LABEL });

    expect(link).toHaveAttribute('href', MOCK_HREF);
  });

  it('omits aria-current when not current', () => {
    setup();

    const link = screen.getByRole('link', { name: MOCK_LABEL });

    expect(link).not.toHaveAttribute(ARIA_CURRENT);
  });

  it('sets aria-current to page when current', () => {
    setup({ isCurrent: true });

    const link = screen.getByRole('link', { name: MOCK_LABEL });

    expect(link).toHaveAttribute(ARIA_CURRENT, ARIA_CURRENT_PAGE);
  });

  it('names the link by ariaLabel when given', () => {
    setup({ ariaLabel: MOCK_ARIA_LABEL });

    const link = screen.getByRole('link', { name: MOCK_ARIA_LABEL });

    expect(link).toBeVisible();
  });

  it('renders a childless link named by ariaLabel', () => {
    setup({ children: undefined, ariaLabel: MOCK_ARIA_LABEL });

    const link = screen.getByRole('link', { name: MOCK_ARIA_LABEL });

    expect(link).toBeEmptyDOMElement();
  });

  it('opens in a new tab when target is _blank', () => {
    setup({ target: '_blank' });

    const link = screen.getByRole('link', { name: MOCK_LABEL });

    expect(link).toHaveAttribute('target', '_blank');
  });

  it('forwards title, lang and hrefLang to the link', () => {
    setup({
      title: MOCK_ARIA_LABEL,
      lang: LOCALE_ISO_CODES.DE,
      hrefLang: LOCALE_ISO_CODES.DE,
    });

    const link = screen.getByRole('link', { name: MOCK_LABEL });

    expect(link).toHaveAttribute('title', MOCK_ARIA_LABEL);
    expect(link).toHaveAttribute('lang', LOCALE_ISO_CODES.DE);
    expect(link).toHaveAttribute('hreflang', LOCALE_ISO_CODES.DE);
  });

  it('renders through the as component', () => {
    setup({ as: MockLink });

    const mockLink = screen.getByTestId(MOCK_LINK_TEST_ID);

    expect(mockLink).toHaveAttribute('href', MOCK_HREF);
  });

  describe('without href', () => {
    beforeEach(() => {
      setup({ href: undefined, dataTestId: TEXT_LINK_TEST_ID });
    });

    it('renders plain text rather than a link', () => {
      const link = screen.queryByRole('link');
      const plainText = screen.getByText(MOCK_LABEL);

      expect(link).not.toBeInTheDocument();
      expect(plainText).toBeVisible();
    });

    it('is skipped by Tab', async () => {
      await user.tab();

      const textLink = screen.getByTestId(TEXT_LINK_TEST_ID);

      expect(textLink).not.toHaveFocus();
    });
  });

  describe('without href when current', () => {
    it('still marks the current item with aria-current', () => {
      setup({
        href: undefined,
        isCurrent: true,
        dataTestId: TEXT_LINK_TEST_ID,
      });

      const textLink = screen.getByTestId(TEXT_LINK_TEST_ID);

      expect(textLink).toHaveAttribute(ARIA_CURRENT, ARIA_CURRENT_PAGE);
    });
  });

  it('keeps ariaLabel as the readable text without href', () => {
    setup({
      href: undefined,
      ariaLabel: MOCK_ARIA_LABEL,
      dataTestId: TEXT_LINK_TEST_ID,
    });

    const textLink = screen.getByTestId(TEXT_LINK_TEST_ID);

    expect(textLink).toHaveTextContent(MOCK_ARIA_LABEL);
  });

  it('requires children or ariaLabel to name the link', () => {
    expectTypeOf<{ href: string }>().not.toExtend<TTextLinkProps>();
    expectTypeOf<{ ariaLabel: string }>().toExtend<TTextLinkProps>();
    expectTypeOf<{ children: string }>().toExtend<TTextLinkProps>();
  });
});
