import { customRender, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';

import { BrandLockup } from './brand-lockup';

faker.seed(123);

const setup = customRender(BrandLockup, {
  prefix: faker.word.noun(),
});

describe(`<${BrandLockup.name}/>`, () => {
  it('renders the mark and the wordmark from prefix/suffix', () => {
    const prefix = faker.word.noun();
    const suffix = faker.word.noun();
    const { container } = setup({ prefix, suffix });
    expect(container.querySelectorAll('polygon')).toHaveLength(3);
    expect(screen.getByText(prefix)).toBeVisible();
    expect(screen.getByText(suffix)).toBeVisible();
  });

  it('renders the mark decoratively — no accessible role or name', () => {
    setup();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('does not render a spec line by default', () => {
    const specLine = faker.hacker.phrase();
    setup();
    expect(screen.queryByText(specLine)).not.toBeInTheDocument();
  });

  it('renders the spec line when specLine is set', () => {
    const specLine = faker.hacker.phrase();
    setup({ specLine });
    expect(screen.getByText(specLine)).toBeVisible();
  });
});
