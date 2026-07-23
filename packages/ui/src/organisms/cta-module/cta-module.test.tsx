import { customRender, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';

import { CtaModule } from './cta-module';

faker.seed(123);

const setup = customRender(CtaModule, {
  heading: faker.lorem.sentence(3),
  action: <a href="/subscribe">Subscribe</a>,
});

describe(`<${CtaModule.name}/>`, () => {
  it('renders the heading', () => {
    const heading = faker.lorem.sentence(4);
    setup({ heading });

    expect(screen.getByRole('heading', { name: heading })).toBeVisible();
  });

  it('renders the text when provided', () => {
    const text = faker.lorem.sentence(8);
    setup({ text });

    expect(screen.getByText(text)).toBeVisible();
  });

  it('does not render text when omitted', () => {
    setup();

    expect(screen.queryByText(faker.lorem.sentence(8))).not.toBeInTheDocument();
  });

  it('renders the action slot', () => {
    setup();

    expect(screen.getByRole('link', { name: 'Subscribe' })).toHaveAttribute(
      'href',
      '/subscribe',
    );
  });

  it('labels the section via the heading when headingId is provided', () => {
    const heading = faker.lorem.sentence(4);
    const { container } = setup({ heading, headingId: 'cta-heading' });

    const section = container.querySelector('section');
    expect(section).toHaveAttribute('aria-labelledby', 'cta-heading');
    expect(screen.getByRole('heading', { name: heading })).toHaveAttribute(
      'id',
      'cta-heading',
    );
  });

  it('forwards data-testid', () => {
    setup({ dataTestId: 'cta-module' });

    expect(screen.getByTestId('cta-module')).toBeVisible();
  });
});
