import { ARIA_CURRENT } from '@blog/ui/testing/aria';
import { customRender, screen } from '@blog/ui/testing/custom-render';
import { MOCK_LINK_TEST_ID, MockLink } from '@blog/ui/testing/mock-link';
import { faker } from '@faker-js/faker';
import userEvent from '@testing-library/user-event';

import { TextLink, type TTextLinkProps } from './text-link';

faker.seed(123);

const LABEL = faker.lorem.words(3);
const HREF = `/${faker.lorem.slug()}`;
const TEXT_LINK_TEST_ID = 'text-link';

const setup = customRender(TextLink, { href: HREF, children: LABEL });

describe(`<${TextLink.name}/>`, () => {
  describe('with the default props', () => {
    beforeEach(() => {
      setup();
    });

    it('renders a link to href named by its children', () => {
      const link = screen.getByRole('link', { name: LABEL });
      expect(link).toHaveAttribute('href', HREF);
    });

    it('omits aria-current when not current', () => {
      const link = screen.getByRole('link');
      expect(link).not.toHaveAttribute(ARIA_CURRENT);
    });
  });

  it('names the link by ariaLabel when given', () => {
    const ariaLabel = faker.lorem.words(2);
    setup({ ariaLabel });
    const link = screen.getByRole('link', { name: ariaLabel });
    expect(link).toBeVisible();
  });

  it('renders a childless link named by ariaLabel', () => {
    const ariaLabel = faker.lorem.words(2);
    setup({ children: undefined, ariaLabel });
    const link = screen.getByRole('link', { name: ariaLabel });
    expect(link).toBeEmptyDOMElement();
  });

  it('opens in a new tab when target is _blank', () => {
    setup({ target: '_blank' });
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('forwards title, lang and hrefLang to the link', () => {
    setup({ title: LABEL, lang: 'de', hrefLang: 'de' });
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('title', LABEL);
    expect(link).toHaveAttribute('lang', 'de');
    expect(link).toHaveAttribute('hreflang', 'de');
  });

  it('sets aria-current="page" when current', () => {
    setup({ isCurrent: true });
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute(ARIA_CURRENT, 'page');
  });

  it('renders through the as component', () => {
    setup({ as: MockLink });
    const mockLink = screen.getByTestId(MOCK_LINK_TEST_ID);
    expect(mockLink).toHaveAttribute('href', HREF);
  });

  it('forwards data-testid', () => {
    setup({ dataTestId: TEXT_LINK_TEST_ID });
    const textLink = screen.getByTestId(TEXT_LINK_TEST_ID);
    expect(textLink).toBeVisible();
  });

  describe('without href', () => {
    it('renders plain text rather than a link', () => {
      setup({ href: undefined });
      const link = screen.queryByRole('link');
      const plainText = screen.getByText(LABEL);
      expect(link).not.toBeInTheDocument();
      expect(plainText).toBeVisible();
    });

    it('is skipped by Tab', async () => {
      setup({ href: undefined, dataTestId: TEXT_LINK_TEST_ID });
      await userEvent.tab();
      const textLink = screen.getByTestId(TEXT_LINK_TEST_ID);
      expect(textLink).not.toHaveFocus();
      expect(document.body).toHaveFocus();
    });

    it('still marks the current item with aria-current', () => {
      setup({
        href: undefined,
        isCurrent: true,
        dataTestId: TEXT_LINK_TEST_ID,
      });
      const textLink = screen.getByTestId(TEXT_LINK_TEST_ID);
      expect(textLink).toHaveAttribute(ARIA_CURRENT, 'page');
    });

    it('keeps ariaLabel as the readable text', () => {
      const ariaLabel = faker.lorem.words(2);
      setup({ href: undefined, ariaLabel, dataTestId: TEXT_LINK_TEST_ID });
      const textLink = screen.getByTestId(TEXT_LINK_TEST_ID);
      expect(textLink).toHaveTextContent(ariaLabel);
    });
  });

  it('requires children or ariaLabel to name the link', () => {
    expectTypeOf<{ href: string }>().not.toExtend<TTextLinkProps>();
    expectTypeOf<{ ariaLabel: string }>().toExtend<TTextLinkProps>();
    expectTypeOf<{ children: string }>().toExtend<TTextLinkProps>();
  });
});
