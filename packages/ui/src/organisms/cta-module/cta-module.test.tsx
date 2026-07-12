import { faker } from '@faker-js/faker';
import { render, screen } from '@testing-library/react';

import { CtaModule } from './cta-module';

faker.seed(123);

describe(`<${CtaModule.name}/>`, () => {
  it('renders the heading', () => {
    const heading = faker.lorem.sentence(4);
    render(
      <CtaModule
        heading={heading}
        action={<a href="/subscribe">Subscribe</a>}
      />,
    );

    expect(screen.getByRole('heading', { name: heading })).toBeVisible();
  });

  it('renders the text when provided', () => {
    const text = faker.lorem.sentence(8);
    render(
      <CtaModule
        heading={faker.lorem.sentence(3)}
        text={text}
        action={<a href="/subscribe">Subscribe</a>}
      />,
    );

    expect(screen.getByText(text)).toBeVisible();
  });

  it('does not render text when omitted', () => {
    render(
      <CtaModule
        heading={faker.lorem.sentence(3)}
        action={<a href="/subscribe">Subscribe</a>}
      />,
    );

    expect(screen.queryByText(faker.lorem.sentence(8))).not.toBeInTheDocument();
  });

  it('renders the action slot', () => {
    render(
      <CtaModule
        heading={faker.lorem.sentence(3)}
        action={<a href="/subscribe">Subscribe</a>}
      />,
    );

    expect(screen.getByRole('link', { name: 'Subscribe' })).toHaveAttribute(
      'href',
      '/subscribe',
    );
  });

  it('labels the section via the heading when headingId is provided', () => {
    const heading = faker.lorem.sentence(4);
    const { container } = render(
      <CtaModule
        heading={heading}
        headingId="cta-heading"
        action={<a href="/subscribe">Subscribe</a>}
      />,
    );

    const section = container.querySelector('section');
    expect(section).toHaveAttribute('aria-labelledby', 'cta-heading');
    expect(screen.getByRole('heading', { name: heading })).toHaveAttribute(
      'id',
      'cta-heading',
    );
  });

  it('forwards data-testid', () => {
    render(
      <CtaModule
        heading={faker.lorem.sentence(3)}
        action={<a href="/subscribe">Subscribe</a>}
        dataTestId="cta-module"
      />,
    );

    expect(screen.getByTestId('cta-module')).toBeVisible();
  });
});
