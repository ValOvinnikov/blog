import { BRAND_VARIANT } from '@blog/config';
import { customRender } from '@web/testing/custom-render';

import { ContentModuleView } from './content-module-view';

const setup = customRender(ContentModuleView, {
  id: 'content-1',
  brandVariant: BRAND_VARIANT.PRIMARY,
  body: [],
  layout: undefined,
  baseUrl: 'https://cdn.sanity.io/images/test-project/test-dataset/',
});

describe(ContentModuleView, () => {
  it('renders the body content, with no accessible name on the section landmark', () => {
    const { container } = setup();

    const section = container.querySelector('section');
    expect(section).not.toHaveAttribute('aria-labelledby');
  });
});
