import { BRAND_VARIANT } from '@blog/config';
import { customRender, screen } from '@web/testing/custom-render';

import { ContentModuleView } from './content-module-view';

const setup = customRender(ContentModuleView, {
  id: 'content-1',
  brandVariant: BRAND_VARIANT.PRIMARY,
  body: [],
  layout: undefined,
});

describe(`<${ContentModuleView.name}/>`, () => {
  it('renders the body content, with no accessible name on the section landmark', () => {
    setup();

    expect(screen.getByTestId('content-module-content-1')).not.toHaveAttribute(
      'aria-labelledby',
    );
  });
});
