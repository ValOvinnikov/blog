import { BRAND_VARIANT } from '@blog/config';
import { customRender, screen } from '@web/testing/custom-render';

import { Section } from './section';

const setup = customRender(Section, {
  brandVariant: BRAND_VARIANT.PRIMARY,
  titleId: 'test-title',
  children: (
    <>
      <h2 id="test-title">Test</h2>
      <p>Content</p>
    </>
  ),
});

describe(`<${Section.name}/>`, () => {
  beforeEach(() => {
    setup();
  });

  it('renders its children', () => {
    expect(screen.getByText('Content')).toBeVisible();
  });

  it('renders as a labelled region whose accessible name matches the heading referenced by titleId', () => {
    expect(screen.getByRole('region', { name: 'Test' })).toBeVisible();
  });
});
