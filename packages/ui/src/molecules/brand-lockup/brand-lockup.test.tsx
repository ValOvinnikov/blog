import { faker } from '@faker-js/faker';
import { render, screen } from '@testing-library/react';

import { BrandLockup } from './brand-lockup';

faker.seed(123);

describe(`<${BrandLockup.name}/>`, () => {
  it('renders the mark and the wordmark from prefix/suffix', () => {
    const prefix = faker.word.noun();
    const suffix = faker.word.noun();
    const { container } = render(
      <BrandLockup prefix={prefix} suffix={suffix} />,
    );
    expect(container.querySelectorAll('polygon')).toHaveLength(3);
    expect(screen.getByText(prefix)).toBeVisible();
    expect(screen.getByText(suffix)).toBeVisible();
  });

  it('renders the mark decoratively — no accessible role or name', () => {
    render(<BrandLockup prefix={faker.word.noun()} />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('does not render a spec line by default', () => {
    const specLine = faker.hacker.phrase();
    render(<BrandLockup prefix={faker.word.noun()} />);
    expect(screen.queryByText(specLine)).not.toBeInTheDocument();
  });

  it('renders the spec line when specLine is set', () => {
    const specLine = faker.hacker.phrase();
    render(<BrandLockup prefix={faker.word.noun()} specLine={specLine} />);
    expect(screen.getByText(specLine)).toBeVisible();
  });
});
