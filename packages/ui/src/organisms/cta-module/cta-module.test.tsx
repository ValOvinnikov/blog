import { BRAND_VARIANT, CTA_ALIGNMENT, CTA_VARIANT } from '@blog/config';
import { customRender, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';

import { CtaModule } from './cta-module';

faker.seed(123);

const setup = customRender(CtaModule, {
  variant: CTA_VARIANT.CALLOUT,
  tone: BRAND_VARIANT.PRIMARY,
  heading: faker.lorem.sentence(3),
});

describe(`<${CtaModule.name}/>`, () => {
  it('renders the heading', () => {
    const heading = faker.lorem.sentence(4);
    setup({ heading });

    expect(screen.getByRole('heading', { name: heading })).toBeVisible();
  });

  it('assigns headingId to the heading element', () => {
    const heading = faker.lorem.sentence(4);
    setup({ heading, headingId: 'cta-heading' });

    expect(screen.getByRole('heading', { name: heading })).toHaveAttribute(
      'id',
      'cta-heading',
    );
  });

  it('renders the eyebrow when provided', () => {
    const eyebrow = faker.lorem.words(2);
    setup({ eyebrow });

    expect(screen.getByText(eyebrow)).toBeVisible();
  });

  it('does not render an eyebrow when omitted', () => {
    setup();

    expect(screen.queryByText(faker.lorem.words(2))).not.toBeInTheDocument();
  });

  it('renders supportingText when provided', () => {
    const supportingText = faker.lorem.sentence(8);
    setup({ supportingText });

    expect(screen.getByText(supportingText)).toBeVisible();
  });

  it('does not render supportingText when omitted', () => {
    setup();

    expect(screen.queryByText(faker.lorem.sentence(8))).not.toBeInTheDocument();
  });

  it('renders content when provided', () => {
    setup({ content: <p>Rich CTA copy</p> });

    expect(screen.getByText('Rich CTA copy')).toBeVisible();
  });

  it('does not render content when omitted', () => {
    setup();

    expect(screen.queryByText('Rich CTA copy')).not.toBeInTheDocument();
  });

  it('renders the actions slot', () => {
    setup({ actions: <a href="/subscribe">Subscribe</a> });

    expect(screen.getByRole('link', { name: 'Subscribe' })).toHaveAttribute(
      'href',
      '/subscribe',
    );
  });

  it('omits the actions wrapper when actions is not provided', () => {
    setup({ actions: undefined });

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('renders footnote when provided', () => {
    const footnote = faker.lorem.sentence(6);
    setup({ footnote });

    expect(screen.getByText(footnote)).toBeVisible();
  });

  it('does not render footnote when omitted', () => {
    setup();

    expect(screen.queryByText(faker.lorem.sentence(6))).not.toBeInTheDocument();
  });

  it('renders the image when provided', () => {
    setup({ image: <img src="/cta.jpg" alt="" data-testid="cta-image" /> });

    expect(screen.getByTestId('cta-image')).toBeVisible();
  });

  it('does not render an image when omitted', () => {
    setup();

    expect(screen.queryByTestId('cta-image')).not.toBeInTheDocument();
  });

  it('forwards data-testid', () => {
    setup({ dataTestId: 'cta-module' });

    expect(screen.getByTestId('cta-module')).toBeVisible();
  });

  it('places the image after the heading in the DOM for Callout, even though it renders above it visually', () => {
    setup({
      variant: CTA_VARIANT.CALLOUT,
      image: <img src="/cta.jpg" alt="" data-testid="cta-image" />,
    });

    const heading = screen.getByRole('heading');
    const image = screen.getByTestId('cta-image');

    expect(
      heading.compareDocumentPosition(image) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('places the image after the heading in the DOM for Split with contentPosition RIGHT', () => {
    setup({
      variant: CTA_VARIANT.SPLIT,
      contentPosition: CTA_ALIGNMENT.RIGHT,
      image: <img src="/cta.jpg" alt="" data-testid="cta-image" />,
    });

    const heading = screen.getByRole('heading');
    const image = screen.getByTestId('cta-image');

    expect(
      heading.compareDocumentPosition(image) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('places the image after the heading in the DOM for Banner, even though it is positioned as a background', () => {
    setup({
      variant: CTA_VARIANT.BANNER,
      image: <img src="/cta.jpg" alt="" data-testid="cta-image" />,
    });

    const heading = screen.getByRole('heading');
    const image = screen.getByTestId('cta-image');

    expect(
      heading.compareDocumentPosition(image) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('renders all three variants without throwing', () => {
    for (const variant of Object.values(CTA_VARIANT)) {
      const { unmount } = setup({ variant });
      expect(screen.getByRole('heading')).toBeVisible();
      unmount();
    }
  });

  it('applies contentPosition and contentAlignment independently on Split', () => {
    setup({
      variant: CTA_VARIANT.SPLIT,
      contentPosition: CTA_ALIGNMENT.RIGHT,
      contentAlignment: CTA_ALIGNMENT.LEFT,
      dataTestId: 'cta-module',
    });

    const root = screen.getByTestId('cta-module');
    const body = screen.getByRole('heading').parentElement;

    expect(body).toHaveClass('md:order-2');
    expect(root).toHaveClass('text-left');
    expect(root).not.toHaveClass('text-right');
  });

  it('applies contentPosition and contentAlignment independently on Banner', () => {
    setup({
      variant: CTA_VARIANT.BANNER,
      contentPosition: CTA_ALIGNMENT.LEFT,
      contentAlignment: CTA_ALIGNMENT.RIGHT,
      dataTestId: 'cta-module',
    });

    const root = screen.getByTestId('cta-module');

    expect(root).toHaveClass('items-start');
    expect(root).toHaveClass('text-right');
    expect(root).not.toHaveClass('items-end');
  });

  it('keeps a centered Callout list left-aligned so markers stay attached to their text', () => {
    setup({
      variant: CTA_VARIANT.CALLOUT,
      contentAlignment: CTA_ALIGNMENT.CENTER,
      content: (
        <ul>
          <li>{faker.lorem.words(3)}</li>
          <li>{faker.lorem.words(3)}</li>
        </ul>
      ),
    });

    const list = screen.getByRole('list');

    expect(list.parentElement).toHaveClass('[&_ul]:inline-block');
    expect(list.parentElement).toHaveClass('[&_ul]:text-left');
  });

  it('does not force inline-block lists on a left-aligned Callout', () => {
    setup({
      variant: CTA_VARIANT.CALLOUT,
      contentAlignment: CTA_ALIGNMENT.LEFT,
      content: (
        <ul>
          <li>{faker.lorem.words(3)}</li>
        </ul>
      ),
    });

    const list = screen.getByRole('list');

    expect(list.parentElement).not.toHaveClass('[&_ul]:inline-block');
  });
});
